import React from "react";
import type { Metadata } from "next";
import { getProducts } from "@/lib/store-db";
import { BundlesClient } from "@/components/BundlesClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Value Bundles & Combo Packs — EVOKA",
  description:
    "Save more with curated home care bundles: Laundry Combo, Kitchen & Dishwash Pack, Full Home Deep Clean Kit. Free delivery across Trivandrum.",
  alternates: {
    canonical: "https://evokahomecare.com/bundles",
  },
};

export default async function BundlesPage() {
  const products = await getProducts();
  return <BundlesClient products={products} />;
}
