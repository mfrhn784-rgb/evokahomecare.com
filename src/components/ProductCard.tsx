"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Star, ShoppingBag, Check } from "lucide-react";
import { Product } from "@/lib/types";
import { useCart } from "@/context/CartContext";
import { SafeImage, getCategoryFallbackImage } from "./SafeImage";

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [justAdded, setJustAdded] = useState(false);

  const variant = product.variants[selectedIdx] || product.variants[0];
  const activeImage = variant?.image || product.image;
  const fallbackImage = getCategoryFallbackImage(product.category);

  const discountPct =
    variant.mrp > variant.price
      ? Math.round(((variant.mrp - variant.price) / variant.mrp) * 100)
      : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      productId: product.id,
      variantId: variant.id,
      name: product.name,
      variantLabel: variant.label,
      price: variant.price,
      mrp: variant.mrp,
      image: activeImage,
      slug: product.slug,
    });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  };

  return (
    <div className="group bg-white rounded-2xl border border-sand p-3 sm:p-4 flex flex-col hover:border-emerald-deep/30 hover:shadow-[0_12px_32px_rgba(21,71,52,0.08)] transition-all duration-300">
      {/* Studio Product Stage - Uncropped object-contain */}
      <Link
        href={`/products/${product.slug}`}
        className="relative aspect-square w-full rounded-xl bg-[#F6F7F4] p-4 sm:p-5 flex items-center justify-center overflow-hidden mb-3.5"
      >
        <SafeImage
          src={activeImage}
          fallbackSrc={fallbackImage}
          alt={`${product.name} ${variant.label}`}
          className="max-h-full max-w-full w-auto h-full object-contain transition-transform duration-500 ease-out group-hover:scale-105"
        />

        {/* Top Left Tag */}
        {product.badge && (
          <span className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase bg-emerald-deep text-white shadow-xs">
            {product.badge}
          </span>
        )}

        {/* Top Right Discount Pill */}
        {discountPct > 0 && (
          <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wide bg-[#E5A91A] text-[#1A1D1B] shadow-xs">
            Save {discountPct}%
          </span>
        )}
      </Link>

      {/* Details */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="uppercase tracking-wider font-bold text-emerald-vibrant truncate pr-2">
              {product.categoryName}
            </span>
            <div className="flex items-center gap-1 font-bold text-charcoal-deep shrink-0">
              <Star className="w-3.5 h-3.5 fill-[#E5A91A] text-[#E5A91A]" />
              <span>{product.rating.toFixed(1)}</span>
              <span className="text-slate-body/60 font-medium">({product.reviewCount})</span>
            </div>
          </div>

          <Link
            href={`/products/${product.slug}`}
            className="font-bold text-sm sm:text-[15px] text-charcoal-deep hover:text-emerald-deep line-clamp-2 leading-snug transition-colors"
          >
            {product.name}
          </Link>

          {product.scent && (
            <p className="text-[11px] text-slate-body mt-1 truncate">
              {product.scent.split(";")[0]}
            </p>
          )}
        </div>

        <div className="pt-3">
          {/* Pack Size Selector Pills */}
          {product.variants.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-3">
              {product.variants.map((v, idx) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedIdx(idx)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer ${
                    idx === selectedIdx
                      ? "bg-emerald-deep text-white border-emerald-deep"
                      : "bg-[#F6F7F4] text-charcoal-deep border-sand hover:border-emerald-deep/40"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          )}

          {/* Price Row */}
          <div className="flex items-baseline justify-between mb-2.5">
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-extrabold text-charcoal-deep">₹{variant.price}</span>
              {variant.mrp > variant.price && (
                <span className="text-xs text-slate-body/60 line-through">₹{variant.mrp}</span>
              )}
            </div>
            <span className="text-[11px] font-semibold text-emerald-vibrant">
              {variant.stock > 0 ? "In Stock" : "Out of Stock"}
            </span>
          </div>

          {/* Full-width Beco-style Add to Cart CTA */}
          <button
            type="button"
            disabled={variant.stock <= 0}
            onClick={handleAdd}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold inline-flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer active:scale-[0.98] ${
              variant.stock <= 0
                ? "bg-sand text-slate-body/50 cursor-not-allowed"
                : justAdded
                ? "bg-mint text-white"
                : "bg-emerald-deep text-white hover:bg-emerald-card"
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Added to Cart</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
