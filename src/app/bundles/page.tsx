import React from "react";
import { getProducts } from "@/lib/store-db";
import { BundlesClient } from "@/components/BundlesClient";

export const dynamic = "force-dynamic";

export default async function BundlesPage() {
  const products = await getProducts();
  return <BundlesClient products={products} />;
}
