import fs from "fs";
import path from "path";
import { PDFDocument, PDFPage, PDFFont, StandardFonts, rgb } from "pdf-lib";
import { BRAND } from "./brand";
import { Product } from "./types";

const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;
const MARGIN = 36;
const CONTENT_WIDTH = A4_WIDTH - MARGIN * 2;

const COLOR_DARK = rgb(0.07, 0.09, 0.08); // #121614
const COLOR_MUTED = rgb(0.36, 0.4, 0.38); // #5C6661
const COLOR_ACCENT = rgb(0.09, 0.3, 0.23); // #184D3B
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

export async function generateCataloguePdfBuffer(products: Product[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(`EVOKA Product Catalogue`);
  doc.setAuthor(BRAND.business.legalName);
  doc.setSubject(`Official Live Product Catalogue`);

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

  const drawPageHeader = (p: PDFPage, isFirst = false): number => {
    let curY = A4_HEIGHT - MARGIN;
    if (isFirst) {
      if (logoImage) {
        const targetH = 32;
        const targetW = (logoImage.width / logoImage.height) * targetH;
        p.drawImage(logoImage, {
          x: MARGIN,
          y: curY - targetH,
          width: targetW,
          height: targetH,
        });
      } else {
        p.drawText(safeText(BRAND.name), {
          x: MARGIN,
          y: curY - 18,
          size: 20,
          font: fontBold,
          color: COLOR_ACCENT,
        });
      }

      p.drawText("OFFICIAL PRODUCT CATALOGUE", {
        x: A4_WIDTH - MARGIN - 230,
        y: curY - 14,
        size: 14,
        font: fontBold,
        color: COLOR_ACCENT,
      });

      p.drawText(safeText(`Generated: ${generatedAtStr}`), {
        x: A4_WIDTH - MARGIN - 230,
        y: curY - 26,
        size: 8,
        font: fontRegular,
        color: COLOR_MUTED,
      });

      curY -= 42;

      p.drawText(safeText(`${BRAND.tagline} • Pallichal & Poovar Outlets, Trivandrum`), {
        x: MARGIN,
        y: curY,
        size: 9,
        font: fontBold,
        color: COLOR_DARK,
      });
      p.drawText(safeText(`WhatsApp / Phone: ${BRAND.phone} | ${BRAND.email}`), {
        x: MARGIN,
        y: curY - 11,
        size: 8,
        font: fontRegular,
        color: COLOR_MUTED,
      });

      curY -= 22;
      p.drawLine({
        start: { x: MARGIN, y: curY },
        end: { x: A4_WIDTH - MARGIN, y: curY },
        thickness: 1,
        color: COLOR_BORDER,
      });
      curY -= 14;
    } else {
      p.drawText("EVOKA Live Catalogue (Continued)", {
        x: MARGIN,
        y: curY - 10,
        size: 8.5,
        font: fontBold,
        color: COLOR_MUTED,
      });
      p.drawText(safeText(generatedAtStr), {
        x: A4_WIDTH - MARGIN - 130,
        y: curY - 10,
        size: 7.5,
        font: fontRegular,
        color: COLOR_MUTED,
      });
      curY -= 20;
      p.drawLine({
        start: { x: MARGIN, y: curY },
        end: { x: A4_WIDTH - MARGIN, y: curY },
        thickness: 0.5,
        color: COLOR_BORDER,
      });
      curY -= 12;
    }
    return curY;
  };

  y = drawPageHeader(page, true);

  // Group products by category
  const categoriesMap: Record<string, Product[]> = {};
  for (const p of products) {
    const cat = p.categoryName || p.category || "General";
    if (!categoriesMap[cat]) categoriesMap[cat] = [];
    categoriesMap[cat].push(p);
  }

  const colX = {
    item: MARGIN + 6,
    sku: MARGIN + 215,
    variant: MARGIN + 285,
    mrp: MARGIN + 355,
    price: MARGIN + 415,
    stock: MARGIN + 475,
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
    p.drawText("PRODUCT & SCENT", { x: colX.item, y: ty, size: 7.5, font: fontBold, color: COLOR_DARK });
    p.drawText("SKU", { x: colX.sku, y: ty, size: 7.5, font: fontBold, color: COLOR_DARK });
    p.drawText("PACK SIZE", { x: colX.variant, y: ty, size: 7.5, font: fontBold, color: COLOR_DARK });
    p.drawText("MRP", { x: colX.mrp, y: ty, size: 7.5, font: fontBold, color: COLOR_DARK });
    p.drawText("PRICE", { x: colX.price, y: ty, size: 7.5, font: fontBold, color: COLOR_ACCENT });
    p.drawText("AVAILABILITY", { x: colX.stock, y: ty, size: 7.5, font: fontBold, color: COLOR_DARK });
    return startY - 20;
  };

  for (const [categoryName, catProducts] of Object.entries(categoriesMap)) {
    if (y < 120) {
      page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
      y = drawPageHeader(page, false);
    }

    // Category Section Header Banner
    page.drawRectangle({
      x: MARGIN,
      y: y - 20,
      width: CONTENT_WIDTH,
      height: 20,
      color: rgb(0.92, 0.95, 0.93),
      borderColor: COLOR_ACCENT,
      borderWidth: 0.75,
    });
    page.drawText(safeText(categoryName.toUpperCase()), {
      x: MARGIN + 10,
      y: y - 14,
      size: 9,
      font: fontBold,
      color: COLOR_ACCENT,
    });
    page.drawText(safeText(`${catProducts.length} Products`), {
      x: A4_WIDTH - MARGIN - 65,
      y: y - 14,
      size: 8,
      font: fontRegular,
      color: COLOR_MUTED,
    });
    y -= 26;
    y = drawTableHeader(page, y);

    for (const prod of catProducts) {
      const scentNote = prod.scent ? ` • Fragrance: ${prod.scent}` : "";
      const prodTitle = `${prod.name}${scentNote}`;

      for (const variant of prod.variants) {
        const rowHeight = 20;
        if (y - rowHeight < 70) {
          page = doc.addPage([A4_WIDTH, A4_HEIGHT]);
          y = drawPageHeader(page, false);
          y = drawTableHeader(page, y);
        }

        const textY = y - 13;

        // Product Name
        const nameLines = wrapLines(prodTitle, fontRegular, 8, 200);
        page.drawText(nameLines[0] || "", {
          x: colX.item,
          y: textY,
          size: 8,
          font: fontBold,
          color: COLOR_DARK,
        });

        // SKU
        page.drawText(safeText(variant.sku || "-"), {
          x: colX.sku,
          y: textY,
          size: 7.5,
          font: fontRegular,
          color: COLOR_MUTED,
        });

        // Pack Variant
        page.drawText(safeText(variant.label), {
          x: colX.variant,
          y: textY,
          size: 8,
          font: fontRegular,
          color: COLOR_DARK,
        });

        // MRP
        const mrpVal = variant.mrp && variant.mrp > variant.price ? variant.mrp : variant.price;
        page.drawText(formatINR(mrpVal), {
          x: colX.mrp,
          y: textY,
          size: 8,
          font: fontRegular,
          color: COLOR_MUTED,
        });

        // Price
        page.drawText(formatINR(variant.price), {
          x: colX.price,
          y: textY,
          size: 8,
          font: fontBold,
          color: COLOR_ACCENT,
        });

        // Stock Status
        const inStock = variant.stock > 0;
        const stockText = inStock ? `In Stock (${variant.stock})` : "Out of Stock";
        const stockColor = inStock ? rgb(0.08, 0.55, 0.28) : rgb(0.78, 0.15, 0.15);
        page.drawText(safeText(stockText), {
          x: colX.stock,
          y: textY,
          size: 7.5,
          font: fontBold,
          color: stockColor,
        });

        y -= rowHeight;
        page.drawLine({
          start: { x: MARGIN, y },
          end: { x: A4_WIDTH - MARGIN, y },
          thickness: 0.3,
          color: COLOR_BORDER,
        });
      }
    }
    y -= 12;
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
      "EVOKA Home & Personal Care • Customer Support: +91 9143374741 • evokahomecare.com • Engineered by farspective.in",
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
