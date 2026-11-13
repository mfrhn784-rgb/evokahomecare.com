import fs from "fs";
import path from "path";
import { PDFDocument, PDFPage, PDFFont, StandardFonts, rgb } from "pdf-lib";
import { BRAND } from "./brand";
import { Order, OrderInvoice } from "./types";

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN = 40;
const CONTENT_WIDTH = A4_WIDTH - MARGIN * 2;

const COLOR_DARK = rgb(0.07, 0.09, 0.08); // #121614
const COLOR_MUTED = rgb(0.36, 0.4, 0.38); // #5C6661
const COLOR_ACCENT = rgb(0.09, 0.3, 0.23); // #184D3B
const COLOR_BORDER = rgb(0.84, 0.86, 0.84);
const COLOR_ROW_ALT = rgb(0.96, 0.97, 0.96);

function safeText(input: string | undefined | null): string {
  if (!input) return "";
  // Standard Helvetica uses WinAnsi encoding; replace unsupported Unicode safely
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

function wrapLines(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const clean = safeText(text);
  if (!clean) return [];
  const words = clean.split(" ");
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function generateInvoicePdfBuffer(
  order: Order,
  invoice: OrderInvoice
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`EVOKA Invoice ${invoice.invoiceNumber}`);
  doc.setAuthor(BRAND.business.legalName);
  doc.setSubject(`Invoice for Order ${order.id}`);

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

  // --- Header: Logo & Business Details (Left) vs Invoice Metadata (Right) ---
  const headerTop = y;
  if (logoImage) {
    const targetH = 34;
    const targetW = (logoImage.width / logoImage.height) * targetH;
    page.drawImage(logoImage, {
      x: MARGIN,
      y: headerTop - targetH,
      width: targetW,
      height: targetH,
    });
    y = headerTop - targetH - 10;
  } else {
    page.drawText(safeText(BRAND.name), {
      x: MARGIN,
      y: headerTop - 20,
      size: 20,
      font: fontBold,
      color: COLOR_ACCENT,
    });
    y = headerTop - 34;
  }

  page.drawText(safeText(BRAND.business.legalName), {
    x: MARGIN,
    y,
    size: 10,
    font: fontBold,
    color: COLOR_DARK,
  });
  y -= 13;

  for (const addrLine of wrapLines(BRAND.business.address, fontRegular, 8.5, 250)) {
    page.drawText(addrLine, { x: MARGIN, y, size: 8.5, font: fontRegular, color: COLOR_MUTED });
    y -= 11;
  }
  page.drawText(safeText(`Phone: ${BRAND.phone} | Email: ${BRAND.email}`), {
    x: MARGIN,
    y,
    size: 8.5,
    font: fontRegular,
    color: COLOR_MUTED,
  });
  y -= 11;
  if (BRAND.business.gstin) {
    page.drawText(safeText(`GSTIN: ${BRAND.business.gstin}`), {
      x: MARGIN,
      y,
      size: 8.5,
      font: fontBold,
      color: COLOR_DARK,
    });
    y -= 11;
  }

  // Right side: Invoice title & metadata
  const rightColX = A4_WIDTH - MARGIN - 205;
  let ry = headerTop - 14;
  const invoiceTitle = invoice.taxRatePercent > 0 ? "TAX INVOICE" : "INVOICE";

  // Derive current verified payment status directly from the order/invoice
  const rawStatus = String(order.paymentStatus || invoice.paymentStatus || "").toUpperCase();
  const isPaid = rawStatus === "PAID";
  const displayPaymentStatus = isPaid ? "PAID" : (order.paymentStatus || invoice.paymentStatus);

  page.drawText(invoiceTitle, {
    x: rightColX,
    y: ry,
    size: 18,
    font: fontBold,
    color: COLOR_ACCENT,
  });

  // If order is marked PAID, render an official green PAID verification stamp
  if (isPaid) {
    const stampW = 56;
    const stampH = 20;
    const stampX = A4_WIDTH - MARGIN - stampW;
    const stampY = ry - 2;
    page.drawRectangle({
      x: stampX,
      y: stampY,
      width: stampW,
      height: stampH,
      borderColor: rgb(0.08, 0.55, 0.28),
      borderWidth: 1.5,
      color: rgb(0.92, 0.98, 0.94),
    });
    page.drawText("PAID", {
      x: stampX + 13,
      y: stampY + 5,
      size: 11,
      font: fontBold,
      color: rgb(0.08, 0.55, 0.28),
    });
  }

  ry -= 18;

  const metaRows: [string, string][] = [
    ["Invoice No:", invoice.invoiceNumber],
    [
      "Invoice Date:",
      new Date(invoice.generatedAt).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    ],
    ["Order ID:", order.id],
    ["Payment Method:", invoice.paymentMethod],
    ["Payment Status:", displayPaymentStatus],
  ];

  for (const [label, val] of metaRows) {
    page.drawText(label, { x: rightColX, y: ry, size: 8.5, font: fontRegular, color: COLOR_MUTED });
    const isStatusLabel = label === "Payment Status:";
    const valColor =
      isStatusLabel && isPaid
        ? rgb(0.08, 0.55, 0.28)
        : isStatusLabel && rawStatus.includes("REJECT")
        ? rgb(0.78, 0.15, 0.15)
        : COLOR_DARK;

    page.drawText(safeText(val), {
      x: rightColX + 82,
      y: ry,
      size: 8.5,
      font: fontBold,
      color: valColor,
    });
    ry -= 13;
  }

  y = Math.min(y, ry) - 12;

  // Divider line
  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: A4_WIDTH - MARGIN, y },
    thickness: 1,
    color: COLOR_BORDER,
  });
  y -= 16;

  // --- Customer & Delivery Block ---
  const billBoxTop = y;
  page.drawText("BILL TO / DELIVER TO", {
    x: MARGIN,
    y,
    size: 8,
    font: fontBold,
    color: COLOR_ACCENT,
  });
  y -= 14;

  page.drawText(safeText(order.customerName), {
    x: MARGIN,
    y,
    size: 10.5,
    font: fontBold,
    color: COLOR_DARK,
  });
  y -= 13;

  page.drawText(
    safeText(`Phone: ${order.phone}${order.email ? ` | Email: ${order.email}` : ""}`),
    { x: MARGIN, y, size: 8.5, font: fontRegular, color: COLOR_MUTED }
  );
  y -= 12;

  const fullAddress =
    order.fulfillmentType === "pickup"
      ? `Store Pickup: ${order.pickupOutlet || BRAND.outlets[0].name}`
      : [
          order.address.line1,
          order.address.landmark ? `Landmark: ${order.address.landmark}` : "",
          `${order.address.city}, ${order.address.state} - ${order.address.pincode}`,
        ]
          .filter(Boolean)
          .join(", ");

  for (const line of wrapLines(fullAddress, fontRegular, 8.5, 340)) {
    page.drawText(line, { x: MARGIN, y, size: 8.5, font: fontRegular, color: COLOR_DARK });
    y -= 11.5;
  }

  if (order.upiReference) {
    page.drawText(safeText(`UPI Transaction Ref: ${order.upiReference}`), {
      x: MARGIN,
      y,
      size: 8.5,
      font: fontBold,
      color: COLOR_ACCENT,
    });
    y -= 12;
  }

  // Right side fulfillment info
  let fry = billBoxTop;
  page.drawText("FULFILLMENT", {
    x: rightColX,
    y: fry,
    size: 8,
    font: fontBold,
    color: COLOR_ACCENT,
  });
  fry -= 14;
  page.drawText(
    order.fulfillmentType === "pickup" ? "Outlet Pickup" : "Doorstep Delivery",
    { x: rightColX, y: fry, size: 9.5, font: fontBold, color: COLOR_DARK }
  );
  fry -= 13;
  page.drawText(safeText(`Order Status: ${order.status}`), {
    x: rightColX,
    y: fry,
    size: 8.5,
    font: fontRegular,
    color: COLOR_MUTED,
  });

  y = Math.min(y, fry) - 14;

  // --- Table Helper ---
  const colX = {
    idx: MARGIN + 6,
    item: MARGIN + 30,
    qty: MARGIN + 320,
    unit: MARGIN + 370,
    total: MARGIN + 448,
  };

  const drawTableHeader = (targetPage: PDFPage, startY: number): number => {
    targetPage.drawRectangle({
      x: MARGIN,
      y: startY - 20,
      width: CONTENT_WIDTH,
      height: 22,
      color: COLOR_ROW_ALT,
      borderColor: COLOR_BORDER,
      borderWidth: 0.75,
    });
    const ty = startY - 13;
    targetPage.drawText("#", { x: colX.idx, y: ty, size: 8.5, font: fontBold, color: COLOR_DARK });
    targetPage.drawText("PRODUCT & PACK VARIANT", {
      x: colX.item,
      y: ty,
      size: 8.5,
      font: fontBold,
      color: COLOR_DARK,
    });
    targetPage.drawText("QTY", { x: colX.qty, y: ty, size: 8.5, font: fontBold, color: COLOR_DARK });
    targetPage.drawText("UNIT PRICE", {
      x: colX.unit,
      y: ty,
      size: 8.5,
      font: fontBold,
      color: COLOR_DARK,
    });
    targetPage.drawText("LINE TOTAL", {
      x: colX.total,
      y: ty,
      size: 8.5,
      font: fontBold,
      color: COLOR_DARK,
    });
    return startY - 22;
  };

  y = drawTableHeader(page, y);

  // --- Table Rows (with multi-page overflow) ---
  order.items.forEach((item, index) => {
    const itemLines = wrapLines(`${item.name} (${item.variantLabel})`, fontRegular, 9, 275);
    const rowHeight = Math.max(22, itemLines.length * 12 + 8);

    if (y - rowHeight < 130) {
      page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
      y = A4_HEIGHT - MARGIN;
      page.drawText(safeText(`EVOKA Invoice ${invoice.invoiceNumber} (Continued)`), {
        x: MARGIN,
        y,
        size: 9,
        font: fontBold,
        color: COLOR_MUTED,
      });
      y -= 16;
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

    const textY = y - 14;
    page.drawText(String(index + 1), {
      x: colX.idx,
      y: textY,
      size: 8.5,
      font: fontRegular,
      color: COLOR_MUTED,
    });

    itemLines.forEach((line, li) => {
      page.drawText(line, {
        x: colX.item,
        y: textY - li * 11.5,
        size: 9,
        font: li === 0 ? fontBold : fontRegular,
        color: COLOR_DARK,
      });
    });

    page.drawText(String(item.quantity), {
      x: colX.qty + 4,
      y: textY,
      size: 9,
      font: fontRegular,
      color: COLOR_DARK,
    });
    page.drawText(formatINR(item.price), {
      x: colX.unit,
      y: textY,
      size: 9,
      font: fontRegular,
      color: COLOR_DARK,
    });
    page.drawText(formatINR(item.price * item.quantity), {
      x: colX.total,
      y: textY,
      size: 9,
      font: fontBold,
      color: COLOR_DARK,
    });

    y -= rowHeight;
    page.drawLine({
      start: { x: MARGIN, y },
      end: { x: A4_WIDTH - MARGIN, y },
      thickness: 0.5,
      color: COLOR_BORDER,
    });
  });

  // --- Totals Block ---
  if (y < 185) {
    page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
    y = A4_HEIGHT - MARGIN - 10;
  }

  y -= 16;
  const summaryX = A4_WIDTH - MARGIN - 220;
  const valX = A4_WIDTH - MARGIN - 75;

  const drawSummaryRow = (label: string, value: string, bold = false, accent = false) => {
    page.drawText(safeText(label), {
      x: summaryX,
      y,
      size: bold ? 10.5 : 9,
      font: bold ? fontBold : fontRegular,
      color: accent ? COLOR_ACCENT : COLOR_DARK,
    });
    page.drawText(safeText(value), {
      x: valX,
      y,
      size: bold ? 10.5 : 9,
      font: bold ? fontBold : fontRegular,
      color: accent ? COLOR_ACCENT : COLOR_DARK,
    });
    y -= bold ? 18 : 14;
  };

  drawSummaryRow("Subtotal", formatINR(invoice.subtotal));
  if (invoice.discount > 0) {
    drawSummaryRow(
      `Discount${order.couponCode ? ` (${order.couponCode})` : ""}`,
      `- ${formatINR(invoice.discount)}`,
      false,
      true
    );
  }
  drawSummaryRow(
    "Delivery Charges",
    invoice.shippingFee === 0 ? "FREE (Rs. 0.00)" : formatINR(invoice.shippingFee)
  );
  if (invoice.taxRatePercent > 0) {
    drawSummaryRow(
      `Included GST (${invoice.taxRatePercent}%)`,
      formatINR(invoice.taxAmount)
    );
  } else {
    drawSummaryRow("Taxes", "Inclusive / N/A");
  }

  page.drawLine({
    start: { x: summaryX, y: y + 6 },
    end: { x: A4_WIDTH - MARGIN, y: y + 6 },
    thickness: 1,
    color: COLOR_ACCENT,
  });
  y -= 6;
  drawSummaryRow("FINAL AMOUNT", formatINR(invoice.total), true, true);

  // Left-side payment confirmation badge for paid orders
  if (isPaid) {
    const leftBoxX = MARGIN;
    const leftBoxY = y + 4;
    page.drawRectangle({
      x: leftBoxX,
      y: leftBoxY,
      width: 220,
      height: 44,
      color: rgb(0.94, 0.98, 0.95),
      borderColor: rgb(0.1, 0.6, 0.3),
      borderWidth: 1,
    });
    page.drawText("PAYMENT RECEIVED IN FULL", {
      x: leftBoxX + 10,
      y: leftBoxY + 30,
      size: 8.5,
      font: fontBold,
      color: rgb(0.08, 0.55, 0.28),
    });
    page.drawText(
      safeText(`Method: ${invoice.paymentMethod}${order.upiReference ? ` (Ref: ${order.upiReference})` : ""}`),
      {
        x: leftBoxX + 10,
        y: leftBoxY + 18,
        size: 7.5,
        font: fontRegular,
        color: COLOR_DARK,
      }
    );
    page.drawText("Official Status: PAID & VERIFIED", {
      x: leftBoxX + 10,
      y: leftBoxY + 7,
      size: 7.5,
      font: fontBold,
      color: rgb(0.08, 0.55, 0.28),
    });
  }

  // --- Footer on every page ---
  const pages = doc.getPages();
  pages.forEach((p, idx) => {
    const footerY = 48;
    p.drawLine({
      start: { x: MARGIN, y: footerY + 14 },
      end: { x: A4_WIDTH - MARGIN, y: footerY + 14 },
      thickness: 0.5,
      color: COLOR_BORDER,
    });
    p.drawText(
      "Thank you for choosing EVOKA Home & Personal Care! For support, contact us on WhatsApp or email.",
      { x: MARGIN, y: footerY, size: 8, font: fontRegular, color: COLOR_MUTED }
    );
    p.drawText(safeText(`Page ${idx + 1} of ${pages.length}`), {
      x: A4_WIDTH - MARGIN - 55,
      y: footerY,
      size: 8,
      font: fontRegular,
      color: COLOR_MUTED,
    });
  });

  return doc.save();
}
