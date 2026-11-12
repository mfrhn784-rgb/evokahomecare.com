import { NextRequest, NextResponse } from "next/server";
import { getProducts, saveProducts } from "@/lib/store-db";
import { verifyAdminSession } from "@/lib/admin-auth";
import { importProductsFromCsv } from "@/lib/csv-import";

export async function POST(req: NextRequest) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ error: "Unauthorized. Please sign in to Admin." }, { status: 401 });
  }

  try {
    const { csvText, mode } = (await req.json()) as {
      csvText: string;
      mode?: "merge" | "replace";
    };
    if (!csvText || !csvText.trim()) {
      return NextResponse.json({ error: "Empty CSV data." }, { status: 400 });
    }

    const existing = await getProducts();
    const { products, importedRows } = importProductsFromCsv(
      csvText,
      existing,
      mode === "replace" ? "replace" : "merge"
    );
    await saveProducts(products);

    return NextResponse.json({
      importedCount: importedRows,
      totalProducts: products.length,
      products,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to parse CSV rows." },
      { status: 400 }
    );
  }
}
