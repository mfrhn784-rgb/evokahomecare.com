import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import { generateOrGetOrderInvoice, getOrderById } from "@/lib/store-db";
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
  const { id } = await context.params;
  const decodedId = decodeURIComponent(id);
  const isAdmin = verifyAdminSession(req);

  // If not admin, verify mobile number matches the order
  if (!isAdmin) {
    const { searchParams } = new URL(req.url);
    const queryPhone = String(searchParams.get("phone") || "").replace(/\D/g, "").slice(-10);
    const order = await getOrderById(decodedId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    const orderPhone = order.phone.replace(/\D/g, "").slice(-10);

    if (!queryPhone || queryPhone !== orderPhone) {
      return NextResponse.json(
        { error: "Valid matching phone number required to view invoice." },
        { status: 403 }
      );
    }
  }

  const result = await generateOrGetOrderInvoice(decodedId);
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
