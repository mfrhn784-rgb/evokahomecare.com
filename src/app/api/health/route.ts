import { NextResponse } from "next/server";
import { getProducts } from "@/lib/store-db";
import { isBlobsRuntime } from "@/lib/netlify-blobs-helper";

export const dynamic = "force-dynamic";

export async function GET() {
  const start = Date.now();
  const products = await getProducts();
  return NextResponse.json({
    ok: true,
    blobsRuntime: isBlobsRuntime(),
    productCount: products.length,
    durationMs: Date.now() - start,
  });
}
