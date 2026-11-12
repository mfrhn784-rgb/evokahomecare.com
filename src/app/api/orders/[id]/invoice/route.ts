import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { generateOrGetOrderInvoice } from "@/lib/store-db";
import { generateInvoicePdfBuffer } from "@/lib/invoice-pdf";

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const result = await generateOrGetOrderInvoice(decodeURIComponent(id));
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  return NextResponse.json({
    order: result.order,
    invoice: result.invoice,
    newlyGenerated: result.newlyGenerated,
  });
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const result = await generateOrGetOrderInvoice(decodeURIComponent(id));
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status });
  }

  const pdfBytes = await generateInvoicePdfBuffer(result.order, result.invoice);
  const { searchParams } = new URL(req.url);
  const download = searchParams.get("download") === "1";
  const fileName = `EVOKA-Invoice-${result.invoice.invoiceNumber}.pdf`;

  return new NextResponse(Buffer.from(pdfBytes), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
