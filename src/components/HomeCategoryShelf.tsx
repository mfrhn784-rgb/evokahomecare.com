"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BRAND, normalizeCategorySlug } from "@/lib/brand";
import { Product } from "@/lib/types";
import { ProductCard } from "./ProductCard";
import { CategoryIcon } from "./CategoryIcon";

export function HomeCategoryShelf({ products }: { products: Product[] }) {
  const [activeCat, setActiveCat] = useState<string>(BRAND.categories[0].slug);

  const visibleProducts = useMemo(() => {
    return products.filter((p) => normalizeCategorySlug(p.category) === activeCat).slice(0, 8);
  }, [products, activeCat]);

  const activeCategoryObj = BRAND.categories.find((c) => c.slug === activeCat);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-vibrant">
            Browse by Aisles
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-charcoal-deep mt-1">
            Explore Our Full Range
          </h2>
        </div>

        <Link
          href={`/shop?category=${activeCat}`}
          className="text-xs sm:text-sm font-bold text-emerald-deep hover:text-emerald-vibrant inline-flex items-center gap-1"
        >
          <span>View All {activeCategoryObj?.name}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Category Filter Tabs with Pro Icons */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-4 mb-4">
        {BRAND.categories.map((cat) => {
          const isActive = cat.slug === activeCat;
          const count = products.filter((p) => normalizeCategorySlug(p.category) === cat.slug).length;
          if (count === 0) return null;
          return (
            <button
              key={cat.slug}
              type="button"
              onClick={() => setActiveCat(cat.slug)}
              className={`shrink-0 px-4 py-2.5 rounded-xl text-xs font-bold inline-flex items-center gap-2 border transition-all cursor-pointer ${
                isActive
                  ? "bg-emerald-deep text-white border-emerald-deep shadow-sm"
                  : "bg-[#F6F7F4] text-charcoal-deep border-sand hover:border-emerald-deep/40"
              }`}
            >
              <CategoryIcon
                slug={cat.slug}
                className={`w-4 h-4 ${isActive ? "text-[#E5A91A]" : "text-emerald-deep"}`}
              />
              <span>{cat.name}</span>
              <span
                className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                  isActive ? "bg-white/15 text-white" : "bg-white text-slate-body"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
        {visibleProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
