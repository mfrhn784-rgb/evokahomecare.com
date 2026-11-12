"use client";

import React, { useMemo, useState } from "react";
import { Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { Product } from "@/lib/types";
import { BRAND } from "@/lib/brand";
import { ProductCard } from "./ProductCard";

const PAGE_SIZE = 16;

export function ShopClient({
  initialProducts,
  initialCategory = "all",
  initialQuery = "",
}: {
  initialProducts: Product[];
  initialCategory?: string;
  initialQuery?: string;
}) {
  const [category, setCategory] = useState(initialCategory);
  const [query, setQuery] = useState(initialQuery);
  const [sort, setSort] = useState<"featured" | "price-asc" | "price-desc" | "rating">("featured");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = initialProducts.filter((p) => {
      const catOk = category === "all" || p.category === category;
      if (!catOk) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.shortTagline.toLowerCase().includes(q) ||
        p.scent.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        p.variants.some((v) => v.sku.toLowerCase().includes(q) || v.label.toLowerCase().includes(q))
      );
    });

    if (sort === "price-asc") {
      list = [...list].sort((a, b) => (a.variants[0]?.price || 0) - (b.variants[0]?.price || 0));
    } else if (sort === "price-desc") {
      list = [...list].sort((a, b) => (b.variants[0]?.price || 0) - (a.variants[0]?.price || 0));
    } else if (sort === "rating") {
      list = [...list].sort((a, b) => b.rating - a.rating);
    }

    return list;
  }, [initialProducts, category, query, sort]);

  const shown = filtered.slice(0, visibleCount);

  return (
    <div className="mesh-bg min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-8 border-b border-emerald-deep/10">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-mint-light text-emerald-vibrant text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3 text-champagne" />
              <span>Full Collection</span>
            </span>
            <h1 className="font-editorial text-3xl sm:text-5xl font-bold text-emerald-deep">
              {category === "all"
                ? "All Home & Personal Care"
                : BRAND.categories.find((c) => c.slug === category)?.name || "Products"}
            </h1>
            <p className="text-xs sm:text-sm text-slate-body mt-1 font-medium">
              Showing {shown.length} of {filtered.length} products
            </p>
          </div>

          {/* Search & Sort */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 sm:w-72">
              <Search className="w-4 h-4 text-emerald-deep/40 absolute left-3.5 top-3" />
              <input
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setVisibleCount(PAGE_SIZE);
                }}
                placeholder="Search scent, category, pack..."
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-full bg-white border border-emerald-deep/15 focus:outline-none focus:border-emerald-vibrant focus:ring-2 focus:ring-mint/20 shadow-xs"
              />
            </div>

            <div className="inline-flex items-center gap-2 bg-white border border-emerald-deep/15 rounded-full px-4 py-2.5 text-xs sm:text-sm shadow-xs">
              <SlidersHorizontal className="w-4 h-4 text-emerald-vibrant" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as typeof sort)}
                className="bg-transparent focus:outline-none text-charcoal-deep font-semibold cursor-pointer"
              >
                <option value="featured">Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Filter Pills (Scrollable) */}
        <div className="flex flex-wrap gap-2 py-6">
          <button
            type="button"
            onClick={() => {
              setCategory("all");
              setVisibleCount(PAGE_SIZE);
            }}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
              category === "all"
                ? "bg-emerald-deep text-pearl shadow-md shadow-emerald-deep/20 scale-105"
                : "bg-white text-charcoal-deep border border-emerald-deep/10 hover:border-mint"
            }`}
          >
            All Categories ({initialProducts.length})
          </button>
          {BRAND.categories.map((cat) => {
            const count = initialProducts.filter((p) => p.category === cat.slug).length;
            if (count === 0 && category !== cat.slug) return null;
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => {
                  setCategory(cat.slug);
                  setVisibleCount(PAGE_SIZE);
                }}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  category === cat.slug
                    ? "bg-emerald-deep text-pearl shadow-md shadow-emerald-deep/20 scale-105"
                    : "bg-white text-charcoal-deep border border-emerald-deep/10 hover:border-mint"
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Product Grid */}
        {shown.length === 0 ? (
          <div className="text-center py-24 glass-panel rounded-3xl border border-emerald-deep/10 shadow-xs">
            <p className="font-editorial text-2xl font-bold text-emerald-deep">
              No matching products found
            </p>
            <p className="text-xs sm:text-sm text-slate-body mt-1">
              Try clearing your search terms or picking another category.
            </p>
            <button
              type="button"
              onClick={() => {
                setCategory("all");
                setQuery("");
              }}
              className="mt-6 px-6 py-3 rounded-full bg-emerald-deep text-pearl text-xs font-bold hover:bg-emerald-vibrant transition-all cursor-pointer shadow-sm"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {shown.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {visibleCount < filtered.length && (
              <div className="mt-12 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="px-8 py-3.5 rounded-full bg-white border border-emerald-deep/20 font-bold text-xs sm:text-sm text-emerald-deep hover:bg-emerald-deep hover:text-white transition-all shadow-xs cursor-pointer"
                >
                  Load More ({filtered.length - visibleCount} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
