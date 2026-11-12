"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Star, ShoppingBag, Check } from "lucide-react";
import { Product } from "@/lib/types";
import { useCart } from "@/context/CartContext";
import { SafeImage, getCategoryFallbackImage } from "./SafeImage";

function getUnitRateLabel(packLabel: string, price: number): string | null {
  const match = packLabel.match(/(\d+(?:\.\d+)?)\s*(ml|l|kg|g)\b/i);
  if (!match || price <= 0) return null;
  const qty = parseFloat(match[1]);
  const unit = match[2].toLowerCase();
  if (!Number.isFinite(qty) || qty <= 0) return null;

  if (unit === "l") return `₹${Math.round(price / qty)}/L`;
  if (unit === "ml") {
    const liters = qty / 1000;
    return liters >= 0.2 ? `₹${Math.round(price / liters)}/L` : null;
  }
  if (unit === "kg") return `₹${Math.round(price / qty)}/kg`;
  if (unit === "g") {
    const kgs = qty / 1000;
    return kgs >= 0.1 ? `₹${Math.round(price / kgs)}/kg` : null;
  }
  return null;
}

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
  const savingsAmt = variant.mrp > variant.price ? variant.mrp - variant.price : 0;
  const unitRate = getUnitRateLabel(variant.label, variant.price);

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
    setTimeout(() => setJustAdded(false), 1300);
  };

  return (
    <div className="group bg-white rounded-xl border border-[#E5E8E3] p-3 sm:p-4 flex flex-col hover:border-[#154734]/40 hover:shadow-md transition-all duration-200">
      {/* Uncropped Studio Stage */}
      <Link
        href={`/products/${product.slug}`}
        className="relative aspect-square w-full rounded-lg bg-[#F6F7F4] p-4 sm:p-5 flex items-center justify-center overflow-hidden mb-3"
      >
        <SafeImage
          src={activeImage}
          fallbackSrc={fallbackImage}
          alt={`${product.name} ${variant.label}`}
          className="max-h-full max-w-full w-auto h-full object-contain transition-transform duration-300 group-hover:scale-105"
        />

        {product.badge && (
          <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-[#154734] text-white">
            {product.badge}
          </span>
        )}

        {discountPct > 0 && (
          <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-extrabold bg-[#E5A91A] text-[#141A16]">
            {discountPct}% OFF
          </span>
        )}
      </Link>

      {/* Product Info */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between gap-2 text-[11px] mb-1">
            <span className="uppercase tracking-wider font-semibold text-[#1E6B4B] truncate">
              {product.subcategory || product.categoryName}
            </span>
            <div className="flex items-center gap-0.5 font-semibold text-[#141A16] shrink-0">
              <Star className="w-3 h-3 fill-[#E5A91A] text-[#E5A91A]" />
              <span>{product.rating.toFixed(1)}</span>
            </div>
          </div>

          <Link
            href={`/products/${product.slug}`}
            className="font-bold text-sm text-[#141A16] hover:text-[#154734] line-clamp-2 leading-snug transition-colors"
          >
            {product.name}
          </Link>

          {product.scent && (
            <p className="text-[11px] text-[#6B756D] mt-0.5 truncate">
              {product.scent.split(";")[0]}
            </p>
          )}
        </div>

        <div className="pt-3">
          {/* Pack Size Selector Pills for Easy Variant Comparison */}
          {product.variants.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2.5">
              {product.variants.map((v, idx) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setSelectedIdx(idx)}
                  className={`px-2 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer ${
                    idx === selectedIdx
                      ? "bg-[#154734] text-white border-[#154734]"
                      : "bg-[#F6F7F4] text-[#141A16] border-[#E5E8E3] hover:border-[#154734]/40"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>
          )}

          {/* Price + Unit Rate + Stock */}
          <div className="flex items-baseline justify-between gap-1 mb-2.5">
            <div className="flex items-baseline gap-1.5 flex-wrap">
              <span className="text-base sm:text-lg font-extrabold text-[#141A16]">
                ₹{variant.price}
              </span>
              {variant.mrp > variant.price && (
                <span className="text-xs text-[#6B756D] line-through">₹{variant.mrp}</span>
              )}
              {unitRate && (
                <span className="text-[10px] font-semibold text-[#1E6B4B] bg-[#EBF5EE] px-1.5 py-0.5 rounded">
                  {unitRate}
                </span>
              )}
            </div>
            <span
              className={`text-[10px] font-bold shrink-0 ${
                variant.stock <= 0
                  ? "text-red-600"
                  : variant.stock <= 10
                  ? "text-amber-700"
                  : "text-[#1E6B4B]"
              }`}
            >
              {variant.stock <= 0
                ? "Out of Stock"
                : variant.stock <= 10
                ? `Only ${variant.stock} left`
                : savingsAmt > 0
                ? `Save ₹${savingsAmt}`
                : "In Stock"}
            </span>
          </div>

          {/* Add to Cart CTA */}
          <button
            type="button"
            disabled={variant.stock <= 0}
            onClick={handleAdd}
            className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-[0.99] ${
              variant.stock <= 0
                ? "bg-[#E5E8E3] text-[#6B756D] cursor-not-allowed"
                : justAdded
                ? "bg-[#1E6B4B] text-white"
                : "bg-[#154734] text-white hover:bg-[#1E6B4B]"
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" />
                <span>{variant.stock <= 0 ? "Out of Stock" : "Add to Cart"}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
