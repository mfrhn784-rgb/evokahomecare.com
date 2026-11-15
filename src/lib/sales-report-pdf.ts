import fs from "fs";
import path from "path";
import { PDFDocument, PDFPage, PDFFont, StandardFonts, rgb } from "pdf-lib";
import { BRAND } from "./brand";
import { Order } from "./types";

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN = 36;
const CONTENT_WIDTH = A4_WIDTH - MARGIN * 2;

const COLOR_DARK = rgb(0.07, 0.09, 0.08);
const COLOR_MUTED = rgb(0.36, 0.4, 0.38);
const COLOR_ACCENT = rgb(0.09, 0.3, 0.23);
const COLOR_BORDER = rgb(0.85, 0.88, 0.86);
const COLOR_ROW_ALT = rgb(0.965, 0.98, 0.97);

function safeText(input: string | undefined | null): string {
  if (!input) return "";
  return String(input)
    .replace(/₹/g, "Rs. ")
    .replace(/×/g, "x")
    .replace(/–|—/g, "-")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatINR(amount: number): string {
  return `Rs. ${Number(amount || 0).toFixed(2)}`;
}

export async function generateSalesReportPdfBuffer(
  orders: Order[],
  periodLabel: string = "All Time"
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`EVOKA Sales Report - ${periodLabel}`);
  doc.setAuthor(BRAND.business.legalName);

  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  let logoImage = null;
  try {
    const logoPath = path.join(process.cwd(), "public", "images", "evoka-logo.png");
    if (fs.existsSync(logoPath)) {
      const logoBytes = fs.readFileSync(logoPath);
      logoImage = await doc.embedPng(logoBytes);
    }
  } catch {
    logoImage = null;
  }

  let page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
  let y = A4_HEIGHT - MARGIN;

  const now = new Date();
  const generatedAtStr = `${now.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })} at ${now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })}`;

  // Metrics Calculations
  const totalOrders = orders.length;
  const activeOrders = orders.filter((o) => o.status !== "Cancelled");
  const cancelledOrders = orders.filter((o) => o.status === "Cancelled");
  const confirmedOrders = orders.filter((o) =>
    ["Confirmed", "Packed", "Shipped", "Delivered"].includes(o.status)
  );
  const unconfirmedOrders = orders.filter((o) =>
    ["Pending", "PENDING_CONFIRMATION"].includes(o.status)
  );

  const onlineOrders = activeOrders.filter((o) => o.channel !== "offline");
  const offlineOrders = activeOrders.filter((o) => o.channel === "offline");
  const onlineSales = onlineOrders.reduce((sum, o) => sum + o.total, 0);
  const offlineSales = offlineOrders.reduce((sum, o) => sum + o.total, 0);

  const netSales = activeOrders.reduce((sum, o) => sum + o.total, 0);
  const grossSales = orders.reduce((sum, o) => sum + o.total, 0);
  const aov = activeOrders.length > 0 ? Math.round(netSales / activeOrders.length) : 0;

  const upiOrders = activeOrders.filter((o) => o.paymentMethod === "upi");
  const codOrders = activeOrders.filter((o) => o.paymentMethod === "cod");
  const upiSales = upiOrders.reduce((sum, o) => sum + o.total, 0);
  const codSales = codOrders.reduce((sum, o) => sum + o.total, 0);

  // Header
  if (logoImage) {
    const targetH = 30;
    const targetW = (logoImage.width / logoImage.height) * targetH;
    page.drawImage(logoImage, {
      x: MARGIN,
      y: y - targetH,
      width: targetW,
      height: targetH,
    });
  } else {
    page.drawText(safeText(BRAND.name), {
      x: MARGIN,
      y: y - 16,
      size: 18,
      font: fontBold,
      color: COLOR_ACCENT,
    });
  }

  page.drawText("SALES & REVENUE REPORT", {
    x: A4_WIDTH - MARGIN - 215,
    y: y - 14,
    size: 13,
    font: fontBold,
    color: COLOR_ACCENT,
  });

  page.drawText(safeText(`Period: ${periodLabel} • Generated: ${generatedAtStr}`), {
    x: A4_WIDTH - MARGIN - 215,
    y: y - 26,
    size: 7.5,
    font: fontRegular,
    color: COLOR_MUTED,
  });

  y -= 44;

  // KPI Metrics Summary Box
  page.drawRectangle({
    x: MARGIN,
    y: y - 62,
    width: CONTENT_WIDTH,
    height: 62,
    color: rgb(0.95, 0.97, 0.95),
    borderColor: COLOR_BORDER,
    borderWidth: 1,
  });

  const kpis = [
    { label: "TOTAL COMBINED SALES", val: formatINR(netSales) },
    { label: "ONLINE SALES", val: `${formatINR(onlineSales)} (${onlineOrders.length} orders)` },
    { label: "OFFLINE SALES", val: `${formatINR(offlineSales)} (${offlineOrders.length} bills)` },
    { label: "TOTAL TRANSACTIONS", val: String(totalOrders) },
    { label: "CONFIRMED / DELIVERED", val: `${confirmedOrders.length} completed` },
    { label: "AVG TICKET VALUE", val: formatINR(aov) },
  ];

  const colW = CONTENT_WIDTH / 3;
  kpis.forEach((kpi, idx) => {
    const col = idx % 3;
    const row = Math.floor(idx / 3);
    const kx = MARGIN + col * colW + 10;
    const ky = y - 16 - row * 26;

    page.drawText(kpi.label, { x: kx, y: ky, size: 7, font: fontBold, color: COLOR_MUTED });
    page.drawText(safeText(kpi.val), {
      x: kx,
      y: ky - 10,
      size: 9.5,
      font: fontBold,
      color: idx === 0 ? COLOR_ACCENT : COLOR_DARK,
    });
  });

  y -= 78;

  // Table header
  const colX = {
    date: MARGIN + 4,
    id: MARGIN + 95,
    cust: MARGIN + 165,
    method: MARGIN + 280,
    status: MARGIN + 345,
    fulfill: MARGIN + 415,
    total: MARGIN + 465,
  };

  const drawTableHeader = (p: PDFPage, startY: number): number => {
    p.drawRectangle({
      x: MARGIN,
      y: startY - 18,
      width: CONTENT_WIDTH,
      height: 18,
      color: COLOR_ROW_ALT,
      borderColor: COLOR_BORDER,
      borderWidth: 0.5,
    });
    const ty = startY - 12;
    p.drawText("DATE & TIME", { x: colX.date, y: ty, size: 7.5, font: fontBold, color: COLOR_DARK });
    p.drawText("ORDER ID", { x: colX.id, y: ty, size: 7.5, font: fontBold, color: COLOR_DARK });
    p.drawText("CUSTOMER", { x: colX.cust, y: ty, size: 7.5, font: fontBold, color: COLOR_DARK });
    p.drawText("PAYMENT", { x: colX.method, y: ty, size: 7.5, font: fontBold, color: COLOR_DARK });
    p.drawText("STATUS", { x: colX.status, y: ty, size: 7.5, font: fontBold, color: COLOR_DARK });
    p.drawText("FULFILLMENT", { x: colX.fulfill, y: ty, size: 7.5, font: fontBold, color: COLOR_DARK });
    p.drawText("TOTAL", { x: colX.total, y: ty, size: 7.5, font: fontBold, color: COLOR_DARK });
    return startY - 20;
  };

  y = drawTableHeader(page, y);

  if (orders.length === 0) {
    page.drawText("No orders recorded for this selected time period.", {
      x: MARGIN + 20,
      y: y - 20,
      size: 9,
      font: fontRegular,
      color: COLOR_MUTED,
    });
  } else {
    orders.forEach((order, index) => {
      const rowHeight = 20;
      if (y - rowHeight < 70) {
        page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
        y = A4_HEIGHT - MARGIN - 10;
        y = drawTableHeader(page, y);
      }

      if (index % 2 === 1) {
        page.drawRectangle({
          x: MARGIN,
          y: y - rowHeight,
          width: CONTENT_WIDTH,
          height: rowHeight,
          color: rgb(0.985, 0.99, 0.985),
        });
      }

      const textY = y - 13;
      const oDate = new Date(order.createdAt);
      const dateText = `${oDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })} ${oDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}`;

      page.drawText(safeText(dateText), {
        x: colX.date,
        y: textY,
        size: 7,
        font: fontRegular,
        color: COLOR_DARK,
      });

      const isOffline = order.channel === "offline";
      const displayId = isOffline && order.offlineBillNumber ? order.offlineBillNumber : order.id.slice(-8);

      page.drawText(safeText(displayId), {
        x: colX.id,
        y: textY,
        size: 7,
        font: fontBold,
        color: isOffline ? COLOR_ACCENT : COLOR_MUTED,
      });

      page.drawText(safeText(`${order.customerName.slice(0, 18)} (${order.phone.slice(-4)})`), {
        x: colX.cust,
        y: textY,
        size: 7.5,
        font: fontRegular,
        color: COLOR_DARK,
      });

      const paymentLabel = isOffline ? `OFFLINE (${order.paymentMethod.toUpperCase()})` : order.paymentMethod.toUpperCase();
      page.drawText(safeText(paymentLabel.slice(0, 14)), {
        x: colX.method,
        y: textY,
        size: 7,
        font: fontRegular,
        color: isOffline ? COLOR_ACCENT : COLOR_MUTED,
      });

      const isCancelled = order.status === "Cancelled";
      const isConfirmed = ["Confirmed", "Packed", "Shipped", "Delivered"].includes(order.status);
      const statusColor = isCancelled
        ? rgb(0.78, 0.15, 0.15)
        : isConfirmed
        ? rgb(0.08, 0.55, 0.28)
        : rgb(0.75, 0.45, 0.05);

      page.drawText(safeText(order.status), {
        x: colX.status,
        y: textY,
        size: 7.5,
        font: fontBold,
        color: statusColor,
      });

      const fulfillLabel = isOffline ? "Walk-in (POS)" : order.fulfillmentType === "pickup" ? "Pickup" : "Delivery";
      page.drawText(safeText(fulfillLabel), {
        x: colX.fulfill,
        y: textY,
        size: 7,
        font: fontRegular,
        color: COLOR_MUTED,
      });

      page.drawText(formatINR(order.total), {
        x: colX.total,
        y: textY,
        size: 8,
        font: fontBold,
        color: isCancelled ? rgb(0.6, 0.6, 0.6) : COLOR_ACCENT,
      });

      y -= rowHeight;
      page.drawLine({
        start: { x: MARGIN, y },
        end: { x: A4_WIDTH - MARGIN, y },
        thickness: 0.3,
        color: COLOR_BORDER,
      });
    });
  }

  // Footer on all pages
  const pages = doc.getPages();
  pages.forEach((p, idx) => {
    const footerY = 24;
    p.drawLine({
      start: { x: MARGIN, y: footerY + 10 },
      end: { x: A4_WIDTH - MARGIN, y: footerY + 10 },
      thickness: 0.5,
      color: COLOR_BORDER,
    });
    p.drawText(
      "EVOKA Home & Personal Care • Pallichal & Poovar Uchakkada • evokahomecare.com • Engineered by farspective.in",
      { x: MARGIN, y: footerY, size: 7.5, font: fontRegular, color: COLOR_MUTED }
    );
    p.drawText(safeText(`Page ${idx + 1} of ${pages.length}`), {
      x: A4_WIDTH - MARGIN - 55,
      y: footerY,
      size: 7.5,
      font: fontRegular,
      color: COLOR_MUTED,
    });
  });

  return doc.save();
}
