import React from "react";
import type { Metadata } from "next";
import { getProducts } from "@/lib/store-db";
import { ShopClient } from "@/components/ShopClient";
import { BRAND } from "@/lib/brand";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const activeCategory = BRAND.categories.find((c) => c.slug === params.category);

  if (activeCategory) {
    return {
      title: `${activeCategory.name} — Shop EVOKA Trivandrum`,
      description: `Browse ${activeCategory.name} products from EVOKA. ${activeCategory.shortDesc}. Fast local home delivery across Trivandrum. Cash on delivery available.`,
      alternates: {
        canonical: `https://evokahomecare.com/shop?category=${activeCategory.slug}`,
      },
    };
  }

  if (params.q) {
    return {
      title: `Search results for "${params.q}" — EVOKA Store`,
      description: `Search results for "${params.q}" at EVOKA Home & Personal Care store in Trivandrum.`,
    };
  }

  return {
    title: "Shop All Products | Laundry, Kitchen & Floor Care — EVOKA",
    description:
      "Explore the full catalog of EVOKA laundry detergents, dishwash liquids, floor cleaners, bathroom cleaners, and personal care. Doorstep delivery across Trivandrum.",
    alternates: {
      canonical: "https://evokahomecare.com/shop",
    },
  };
}

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
