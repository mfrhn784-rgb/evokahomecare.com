import { NextRequest, NextResponse } from "next/server";
import {
  bulkModifyStock,
  deleteProduct,
  getProducts,
  resetInventoryToSeed,
  saveProducts,
  upsertProduct,
} from "@/lib/store-db";
import { verifyAdminSession } from "@/lib/admin-auth";
import { Product } from "@/lib/types";

function isAuthorized(req: NextRequest): boolean {
  return verifyAdminSession(req);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const q = searchParams.get("q")?.trim().toLowerCase();

  let products = await getProducts();
  if (category && category !== "all") {
    products = products.filter((p) => p.category === category);
  }
  if (q) {
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.shortTagline.toLowerCase().includes(q) ||
        p.scent.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q)
    );
  }

  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized. Invalid Admin PIN." }, { status: 401 });
  }
  try {
    const body = (await req.json()) as Product;
    if (!body.name || !body.category || !body.variants?.length) {
      return NextResponse.json({ error: "Product name, category, and at least one variant are required." }, { status: 400 });
    }
    const slug =
      body.slug ||
      body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    const product: Product = {
      ...body,
      id: body.id || `evk-${Date.now()}`,
      slug,
      rating: body.rating || 4.8,
      reviewCount: body.reviewCount || 1,
      image: body.image || "/images/detergent-matic-royal-rose-1l.jpg",
      keyIngredients: body.keyIngredients?.length ? body.keyIngredients : ["Active Cleaning Surfactants", "Fragrance Boosters"],
      freeFrom: body.freeFrom?.length ? body.freeFrom : ["Heavy Chalk Fillers", "Unnecessary Dilution"],
      howToUse: body.howToUse || "Follow label instructions for daily home use.",
    };
    const products = await upsertProduct(product);
    return NextResponse.json({ product, products });
  } catch (err) {
    return NextResponse.json({ error: "Invalid product payload" }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();

    // Reset whole catalog and stock levels back to pristine seed defaults
    if (body.action === "reset_to_seed") {
      const reset = await resetInventoryToSeed();
      return NextResponse.json({ products: reset, message: "Inventory reset to seed defaults." });
    }

    // Bulk modify stock levels (set all, restock low items, add to existing, or zero out)
    if (body.action === "bulk_stock_modify") {
      const modified = await bulkModifyStock({
        type: body.modifyType,
        amount: typeof body.amount === "number" ? body.amount : undefined,
        threshold: typeof body.threshold === "number" ? body.threshold : undefined,
        category: body.category,
      });
      return NextResponse.json({ products: modified, message: "Stock levels updated successfully." });
    }

    if (Array.isArray(body.products)) {
      const saved = await saveProducts(body.products);
      return NextResponse.json({ products: saved });
    }
    if (Array.isArray(body.rateUpdates)) {
      const current = await getProducts();
      for (const update of body.rateUpdates) {
        const p = current.find((prod) => prod.id === update.productId);
        if (p) {
          const v = p.variants.find((vnt) => vnt.id === update.variantId);
          if (v) {
            if (typeof update.price === "number") v.price = update.price;
            if (typeof update.mrp === "number") v.mrp = update.mrp;
            if (typeof update.stock === "number") v.stock = update.stock;
          }
        }
      }
      const saved = await saveProducts(current);
      return NextResponse.json({ products: saved });
    }
    return NextResponse.json({ error: "Invalid updates payload" }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update products" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing product id" }, { status: 400 });
  }
  const products = await deleteProduct(id);
  return NextResponse.json({ products });
}
