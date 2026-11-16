import React from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProductBySlug, getProducts } from "@/lib/store-db";
import { ProductDetailClient } from "@/components/ProductDetailClient";
import { BRAND } from "@/lib/brand";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return {
      title: "Product Not Found | EVOKA",
    };
  }

  const categoryName =
    BRAND.categories.find((c) => c.slug === product.category)?.name || product.categoryName || "Home Care";
  const firstVariant = product.variants?.[0];
  const variantLabel = firstVariant?.label ? ` (${firstVariant.label})` : "";
  const price = firstVariant?.price ? ` — ₹${firstVariant.price}` : "";
  const title = `${product.name}${variantLabel}${price}`;
  const desc =
    product.description ||
    product.shortTagline ||
    `Buy authentic ${product.name}${variantLabel} online from EVOKA in Trivandrum, Kerala. Fast local home delivery & COD available.`;
  const imgUrl = product.image.startsWith("http")
    ? product.image
    : `https://evokahomecare.com${product.image}`;

  return {
    title,
    description: desc,
    keywords: [
      product.name,
      `${product.name} Trivandrum`,
      categoryName,
      "EVOKA products",
      "buy detergent online Kerala",
      "home cleaning supplies",
    ],
    openGraph: {
      title: `${product.name} | EVOKA Trivandrum`,
      description: desc,
      url: `https://evokahomecare.com/products/${product.slug}`,
      siteName: "EVOKA Home & Personal Care",
      type: "website",
      images: [
        {
          url: imgUrl,
          width: 800,
          height: 800,
          alt: product.name,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | EVOKA`,
      description: desc,
      images: [imgUrl],
    },
    alternates: {
      canonical: `https://evokahomecare.com/products/${product.slug}`,
    },
  };
}

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

  const categoryObj = BRAND.categories.find((c) => c.slug === product.category);
  const categoryName = categoryObj?.name || product.categoryName || "Home Care";
  const imgUrl = product.image.startsWith("http")
    ? product.image
    : `https://evokahomecare.com${product.image}`;

  const firstVariant = product.variants?.[0];
  const price = firstVariant?.price || 0;

  // Product schema for Google Rich Results (Price, InStock, Currency, Reviews, Rating)
  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": [imgUrl],
    "description":
      product.description ||
      product.shortTagline ||
      `Buy authentic ${product.name} from EVOKA in Trivandrum, Kerala. Fast local home delivery and Cash on Delivery.`,
    "sku": firstVariant?.sku || product.id,
    "mpn": firstVariant?.sku || product.id,
    "brand": {
      "@type": "Brand",
      "name": "EVOKA",
      "logo": "https://evokahomecare.com/images/evoka-logo-square.png"
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": product.rating || 4.7,
      "reviewCount": product.reviewCount || 12
    },
    "offers": {
      "@type": "Offer",
      "url": `https://evokahomecare.com/products/${product.slug}`,
      "priceCurrency": "INR",
      "price": price,
      "priceValidUntil": "2027-12-31",
      "itemCondition": "https://schema.org/NewCondition",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "EVOKA"
      }
    }
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://evokahomecare.com"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": categoryName,
        "item": `https://evokahomecare.com/shop?category=${product.category}`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": product.name,
        "item": `https://evokahomecare.com/products/${product.slug}`
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <ProductDetailClient product={product} related={related} />
    </>
  );
}
