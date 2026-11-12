import React from "react";
import { getProducts } from "@/lib/store-db";
import { ShopClient } from "@/components/ShopClient";

export const dynamic = "force-dynamic";

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const products = await getProducts();

  return (
    <ShopClient
      initialProducts={products}
      initialCategory={params.category || "all"}
      initialQuery={params.q || ""}
    />
  );
}
