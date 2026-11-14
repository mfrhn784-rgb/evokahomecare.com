import { NextRequest, NextResponse } from "next/server";
import { getProducts } from "@/lib/store-db";
import { generateCataloguePdfBuffer } from "@/lib/catalogue-pdf";
import { verifyAdminSession } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ error: "Unauthorized. Admin PIN required." }, { status: 401 });
  }

  try {
    const products = await getProducts();
    const pdfBytes = await generateCataloguePdfBuffer(products);

    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const fileName = `EVOKA-Product-Catalogue-${dateStr}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("GET /api/admin/catalogue-pdf error:", err);
    return NextResponse.json({ error: "Failed to generate catalogue PDF" }, { status: 500 });
  }
}
