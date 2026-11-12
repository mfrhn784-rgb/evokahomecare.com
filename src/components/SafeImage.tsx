"use client";

import React, { useEffect, useState } from "react";
import { BRAND, normalizeCategorySlug } from "@/lib/brand";

export function getCategoryFallbackImage(categorySlug?: string): string {
  const normalized = categorySlug ? normalizeCategorySlug(categorySlug) : "";
  const found = BRAND.categories.find((c) => c.slug === normalized);
  return found?.image || "/images/detergent-matic-royal-rose-1l.jpg";
}

export function SafeImage({
  src,
  fallbackSrc,
  alt,
  className,
}: {
  src: string;
  fallbackSrc?: string;
  alt: string;
  className?: string;
}) {
  const [imgSrc, setImgSrc] = useState(
    src || fallbackSrc || "/images/detergent-matic-royal-rose-1l.jpg"
  );

  useEffect(() => {
    setImgSrc(src || fallbackSrc || "/images/detergent-matic-royal-rose-1l.jpg");
  }, [src, fallbackSrc]);

  return (
    <img
      src={imgSrc}
      alt={alt}
      className={className}
      onError={() => {
        const fb = fallbackSrc || "/images/detergent-matic-royal-rose-1l.jpg";
        if (imgSrc !== fb) {
          setImgSrc(fb);
        }
      }}
    />
  );
}
