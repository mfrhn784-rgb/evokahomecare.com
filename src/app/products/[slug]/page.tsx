import React from "react";
import { notFound } from "next/navigation";
import { getProductBySlug, getProducts } from "@/lib/store-db";
import { ProductDetailClient } from "@/components/ProductDetailClient";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    notFound();
  }

  const all = await getProducts();
  const related = all
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 4);

  return <ProductDetailClient product={product} related={related} />;
}
