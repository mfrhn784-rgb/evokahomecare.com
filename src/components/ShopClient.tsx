"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, X, Sparkles, PackageOpen } from "lucide-react";
import { Product } from "@/lib/types";
import { BRAND, normalizeCategorySlug } from "@/lib/brand";
import { ProductCard } from "./ProductCard";
import { CategoryIcon } from "./CategoryIcon";

const PAGE_SIZE = 16;

type PriceBand = "all" | "under-150" | "150-350" | "350-plus";
type SortOption = "featured" | "price-asc" | "price-desc" | "discount" | "name-asc";

const QUICK_KEYWORDS = [
  "Matic",
  "Dish Wash",
  "Floor Cleaner",
  "Hand Wash",
  "Toilet",
  "Soap",
  "5L",
];

function isValuePack(product: Product): boolean {
  return product.variants.some((v) => /\b(2\s*l|4\s*kg|5\s*l)\b/i.test(v.label));
}

function getMinPrice(product: Product): number {
  if (!product.variants.length) return 0;
  return Math.min(...product.variants.map((v) => v.price));
}

function getMaxDiscountPct(product: Product): number {
  if (!product.variants.length) return 0;
  return Math.max(
    ...product.variants.map((v) =>
      v.mrp > v.price ? Math.round(((v.mrp - v.price) / v.mrp) * 100) : 0
    )
  );
}

export function ShopClient({
  initialProducts,
  initialCategory = "all",
  initialQuery = "",
}: {
  initialProducts: Product[];
  initialCategory?: string;
  initialQuery?: string;
}) {
  const [category, setCategory] = useState(
    initialCategory === "all" ? "all" : normalizeCategorySlug(initialCategory)
  );
  const [subcategory, setSubcategory] = useState("all");
  const [query, setQuery] = useState(initialQuery);
  const [priceBand, setPriceBand] = useState<PriceBand>("all");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [valuePackOnly, setValuePackOnly] = useState(false);
  const [sort, setSort] = useState<SortOption>("featured");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Keep state synced when navigating via header search/category links while already on /shop
  useEffect(() => {
    const nextCat = initialCategory === "all" ? "all" : normalizeCategorySlug(initialCategory);
    setCategory(nextCat);
    setSubcategory("all");
    setVisibleCount(PAGE_SIZE);
  }, [initialCategory]);

  useEffect(() => {
    setQuery(initialQuery);
    setVisibleCount(PAGE_SIZE);
  }, [initialQuery]);

  const activeCatObj = BRAND.categories.find((c) => c.slug === category);

  const availableSubcategories = useMemo(() => {
    if (category === "all") return [];
    const fromBrand = activeCatObj?.subcategories ? [...activeCatObj.subcategories] : [];
    const counts = new Map<string, number>();
    for (const p of initialProducts) {
      if (normalizeCategorySlug(p.category) === category && p.subcategory) {
        counts.set(p.subcategory, (counts.get(p.subcategory) || 0) + 1);
      }
    }
    return fromBrand.filter((s) => (counts.get(s) || 0) > 0);
  }, [category, activeCatObj, initialProducts]);

  const searchMatches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return initialProducts
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.subcategory || "").toLowerCase().includes(q) ||
          p.scent.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [initialProducts, query]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = initialProducts.filter((p) => {
      const normalizedCat = normalizeCategorySlug(p.category);
      if (category !== "all" && normalizedCat !== category) return false;
      if (subcategory !== "all" && p.subcategory !== subcategory) return false;

      if (inStockOnly && !p.variants.some((v) => v.stock > 0)) return false;
      if (valuePackOnly && !isValuePack(p)) return false;

      const minPrice = getMinPrice(p);
      if (priceBand === "under-150" && minPrice >= 150) return false;
      if (priceBand === "150-350" && (minPrice < 150 || minPrice > 350)) return false;
      if (priceBand === "350-plus" && minPrice <= 350) return false;

      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.shortTagline.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.scent.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        (p.subcategory || "").toLowerCase().includes(q) ||
        p.variants.some((v) => v.sku.toLowerCase().includes(q) || v.label.toLowerCase().includes(q))
      );
    });

    if (sort === "price-asc") {
      list = [...list].sort((a, b) => getMinPrice(a) - getMinPrice(b));
    } else if (sort === "price-desc") {
      list = [...list].sort((a, b) => getMinPrice(b) - getMinPrice(a));
    } else if (sort === "discount") {
      list = [...list].sort((a, b) => getMaxDiscountPct(b) - getMaxDiscountPct(a));
    } else if (sort === "name-asc") {
      list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    }

    return list;
  }, [initialProducts, category, subcategory, query, priceBand, inStockOnly, valuePackOnly, sort]);

  const shown = filtered.slice(0, visibleCount);

  const hasActiveFilters =
    category !== "all" ||
    subcategory !== "all" ||
    query.trim() !== "" ||
    priceBand !== "all" ||
    inStockOnly ||
    valuePackOnly;

  const resetAllFilters = () => {
    setCategory("all");
    setSubcategory("all");
    setQuery("");
    setPriceBand("all");
    setInStockOnly(false);
    setValuePackOnly(false);
    setSort("featured");
    setVisibleCount(PAGE_SIZE);
  };

  return (
    <div className="bg-[#FAFAF8] min-h-screen">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 sm:py-10">
        {/* Top Header + Search + Sort */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 pb-6 border-b border-[#E5E8E3]">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[#1E6B4B]">
              EVOKA Catalog
            </p>
            <h1 className="text-2xl sm:text-4xl font-extrabold text-[#141A16] mt-1 tracking-tight">
              {category === "all" ? "All Cleaning & Home Care" : activeCatObj?.name || "Products"}
            </h1>
            <p className="text-xs sm:text-sm text-[#6B756D] mt-1">
              Showing <span className="font-bold text-[#141A16]">{shown.length}</span> of{" "}
              <span className="font-bold text-[#141A16]">{filtered.length}</span> products
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search with Live Suggestions */}
            <div className="relative flex-1 sm:w-80">
              <Search className="w-4 h-4 text-[#6B756D] absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="search"
                value={query}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 160)}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setVisibleCount(PAGE_SIZE);
                  setShowSuggestions(true);
                }}
                placeholder="Search by product, scent, pack (e.g. 5L)..."
                className="w-full pl-10 pr-8 py-2.5 text-xs sm:text-sm rounded-lg bg-white border border-[#E5E8E3] focus:outline-none focus:border-[#154734]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2.5 top-2.5 p-0.5 text-[#6B756D] hover:text-[#141A16] cursor-pointer"
                  aria-label="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}

              {showSuggestions && (
                <div className="absolute left-0 right-0 mt-1 rounded-xl border border-[#E5E8E3] bg-white shadow-lg p-2.5 z-30">
                  {query.trim() && searchMatches.length > 0 ? (
                    <div className="space-y-1">
                      <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-[#6B756D]">
                        Direct Product Matches
                      </p>
                      {searchMatches.map((m) => (
                        <Link
                          key={m.id}
                          href={`/products/${m.slug}`}
                          className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs hover:bg-[#F6F7F4]"
                        >
                          <span className="font-semibold text-[#141A16] truncate">{m.name}</span>
                          <span className="text-[11px] font-bold text-[#154734] shrink-0 ml-2">
                            ₹{getMinPrice(m)}
                          </span>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div>
                      <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-[#6B756D] mb-1.5">
                        Quick Searches
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {QUICK_KEYWORDS.map((kw) => (
                          <button
                            key={kw}
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={() => {
                              setQuery(kw);
                              setVisibleCount(PAGE_SIZE);
                              setShowSuggestions(false);
                            }}
                            className="px-2.5 py-1 rounded-md bg-[#F6F7F4] hover:bg-[#154734] hover:text-white text-[11px] font-semibold text-[#141A16] transition-colors cursor-pointer"
                          >
                            {kw}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sort Select */}
            <div className="inline-flex items-center gap-2 bg-white border border-[#E5E8E3] rounded-lg px-3.5 py-2.5 text-xs sm:text-sm">
              <SlidersHorizontal className="w-4 h-4 text-[#154734] shrink-0" />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
                className="bg-transparent focus:outline-none text-[#141A16] font-semibold cursor-pointer w-full"
                aria-label="Sort products"
              >
                <option value="featured">Sort: Featured</option>
                <option value="price-asc">Price: Low to High</option>
                <option value="price-desc">Price: High to Low</option>
                <option value="discount">Biggest Discount</option>
                <option value="name-asc">Name: A to Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Visual Category Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-4">
          <button
            type="button"
            onClick={() => {
              setCategory("all");
              setSubcategory("all");
              setVisibleCount(PAGE_SIZE);
            }}
            className={`shrink-0 px-3.5 py-2 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
              category === "all"
                ? "bg-[#154734] text-white border-[#154734]"
                : "bg-white text-[#141A16] border-[#E5E8E3] hover:border-[#154734]/40"
            }`}
          >
            All ({initialProducts.length})
          </button>

          {BRAND.categories.map((cat) => {
            const count = initialProducts.filter(
              (p) => normalizeCategorySlug(p.category) === cat.slug
            ).length;
            const isActive = category === cat.slug;
            return (
              <button
                key={cat.slug}
                type="button"
                onClick={() => {
                  setCategory(cat.slug);
                  setSubcategory("all");
                  setVisibleCount(PAGE_SIZE);
                }}
                className={`shrink-0 px-3.5 py-2 rounded-lg text-xs font-bold border inline-flex items-center gap-2 transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[#154734] text-white border-[#154734]"
                    : "bg-white text-[#141A16] border-[#E5E8E3] hover:border-[#154734]/40"
                }`}
              >
                <CategoryIcon
                  slug={cat.slug}
                  className={`w-4 h-4 ${isActive ? "text-[#E5A91A]" : "text-[#154734]"}`}
                />
                <span>{cat.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded ${
                    isActive ? "bg-white/15 text-white" : "bg-[#F6F7F4] text-[#6B756D]"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          <Link
            href="/bundles"
            className="shrink-0 px-3.5 py-2 rounded-lg text-xs font-bold border border-[#154734]/20 bg-[#EBF5EE] text-[#154734] hover:bg-[#154734] hover:text-white inline-flex items-center gap-1.5 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#E5A91A]" />
            <span>Combos &amp; Value Boxes</span>
          </Link>
        </div>

        {/* Subcategory Pills (when a category is active) */}
        {availableSubcategories.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5 pb-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B756D] mr-1">
              Subcategory:
            </span>
            <button
              type="button"
              onClick={() => setSubcategory("all")}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                subcategory === "all"
                  ? "bg-[#141A16] text-white"
                  : "bg-white border border-[#E5E8E3] text-[#141A16] hover:border-[#141A16]/40"
              }`}
            >
              All {activeCatObj?.name}
            </button>
            {availableSubcategories.map((sub) => (
              <button
                key={sub}
                type="button"
                onClick={() => {
                  setSubcategory(sub);
                  setVisibleCount(PAGE_SIZE);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  subcategory === sub
                    ? "bg-[#141A16] text-white"
                    : "bg-white border border-[#E5E8E3] text-[#141A16] hover:border-[#141A16]/40"
                }`}
              >
                {sub}
              </button>
            ))}
          </div>
        )}

        {/* Secondary Filter Bar: Price Range + Availability + Bulk Value Packs */}
        <div className="flex flex-wrap items-center justify-between gap-3 py-3 px-4 rounded-xl bg-white border border-[#E5E8E3] mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B756D]">
              Price:
            </span>
            {(
              [
                { id: "all", label: "All" },
                { id: "under-150", label: "Under ₹150" },
                { id: "150-350", label: "₹150 – ₹350" },
                { id: "350-plus", label: "₹350+" },
              ] as const
            ).map((band) => (
              <button
                key={band.id}
                type="button"
                onClick={() => {
                  setPriceBand(band.id);
                  setVisibleCount(PAGE_SIZE);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                  priceBand === band.id
                    ? "bg-[#154734] text-white"
                    : "bg-[#F6F7F4] text-[#141A16] hover:bg-[#EBF5EE]"
                }`}
              >
                {band.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
            <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-[#141A16]">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => {
                  setInStockOnly(e.target.checked);
                  setVisibleCount(PAGE_SIZE);
                }}
                className="accent-[#154734] rounded cursor-pointer"
              />
              <span>In Stock Only</span>
            </label>

            <label className="inline-flex items-center gap-1.5 cursor-pointer select-none text-[#141A16]">
              <input
                type="checkbox"
                checked={valuePackOnly}
                onChange={(e) => {
                  setValuePackOnly(e.target.checked);
                  setVisibleCount(PAGE_SIZE);
                }}
                className="accent-[#154734] rounded cursor-pointer"
              />
              <span>Value Packs (2L–5L / 4kg)</span>
            </label>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#154734] hover:underline cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear All</span>
              </button>
            )}
          </div>
        </div>

        {/* Product Grid or Empty State */}
        {shown.length === 0 ? (
          <div className="text-center py-16 px-4 bg-white rounded-xl border border-[#E5E8E3]">
            <div className="w-12 h-12 rounded-xl bg-[#F6F7F4] text-[#154734] flex items-center justify-center mx-auto mb-3">
              <PackageOpen className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-[#141A16]">No matching products found</h2>
            <p className="text-xs sm:text-sm text-[#6B756D] mt-1 max-w-md mx-auto">
              Try removing a price or pack filter, or search for one of our popular categories below.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={resetAllFilters}
                className="px-5 py-2.5 rounded-lg bg-[#154734] text-white text-xs font-bold hover:bg-[#1E6B4B] transition-colors cursor-pointer"
              >
                Show All {initialProducts.length} Products
              </button>
              {BRAND.categories.slice(0, 3).map((cat) => (
                <button
                  key={cat.slug}
                  type="button"
                  onClick={() => {
                    resetAllFilters();
                    setCategory(cat.slug);
                  }}
                  className="px-4 py-2.5 rounded-lg border border-[#E5E8E3] bg-[#F6F7F4] text-[#141A16] text-xs font-semibold hover:border-[#154734] cursor-pointer"
                >
                  Browse {cat.name}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
              {shown.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {visibleCount < filtered.length && (
              <div className="mt-10 text-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                  className="px-7 py-3 rounded-lg bg-white border border-[#154734] font-bold text-xs sm:text-sm text-[#154734] hover:bg-[#154734] hover:text-white transition-colors cursor-pointer"
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
