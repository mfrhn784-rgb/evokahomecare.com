import { NextRequest, NextResponse } from "next/server";
import { getOrders } from "@/lib/store-db";
import { generateSalesReportPdfBuffer } from "@/lib/sales-report-pdf";
import { verifyAdminSession } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ error: "Unauthorized. Admin PIN required." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "all";
    const fromDateStr = searchParams.get("from");
    const toDateStr = searchParams.get("to");

    let allOrders = await getOrders();
    const now = new Date();
    let periodLabel = "All Time";

    if (range === "today") {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      allOrders = allOrders.filter((o) => new Date(o.createdAt).getTime() >= todayStart);
      periodLabel = "Today";
    } else if (range === "yesterday") {
      const yStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime();
      const yEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      allOrders = allOrders.filter((o) => {
        const t = new Date(o.createdAt).getTime();
        return t >= yStart && t < yEnd;
      });
      periodLabel = "Yesterday";
    } else if (range === "7days") {
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
      allOrders = allOrders.filter((o) => new Date(o.createdAt).getTime() >= weekStart);
      periodLabel = "Last 7 Days";
    } else if (range === "month") {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      allOrders = allOrders.filter((o) => new Date(o.createdAt).getTime() >= monthStart);
      periodLabel = "This Month";
    } else if (fromDateStr || toDateStr) {
      const fromTime = fromDateStr ? new Date(fromDateStr).getTime() : 0;
      const toTime = toDateStr ? new Date(`${toDateStr}T23:59:59.999Z`).getTime() : Infinity;
      allOrders = allOrders.filter((o) => {
        const t = new Date(o.createdAt).getTime();
        return t >= fromTime && t <= toTime;
      });
      periodLabel = `${fromDateStr || "Start"} to ${toDateStr || "Now"}`;
    }

    const pdfBytes = await generateSalesReportPdfBuffer(allOrders, periodLabel);
    const fileName = `EVOKA-Sales-Report-${range}-${now.toISOString().slice(0, 10)}.pdf`;

    return new NextResponse(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("GET /api/admin/sales-report-pdf error:", err);
    return NextResponse.json({ error: "Failed to generate sales report PDF" }, { status: 500 });
  }
}
