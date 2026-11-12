"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Star,
  ShoppingBag,
  CheckCircle2,
  ShieldCheck,
  Leaf,
  ArrowLeft,
  Plus,
  Minus,
  Sparkles,
  Droplets,
  Truck,
  Check,
} from "lucide-react";
import { Product } from "@/lib/types";
import { useCart } from "@/context/CartContext";
import { ProductCard } from "./ProductCard";
import { SafeImage, getCategoryFallbackImage } from "./SafeImage";

export function ProductDetailClient({
  product,
  related,
}: {
  product: Product;
  related: Product[];
}) {
  const { addItem } = useCart();
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  const variant = product.variants[selectedIdx] || product.variants[0];
  const activeImage = variant?.image || product.image;
  const fallbackImage = getCategoryFallbackImage(product.category);

  const discountPct =
    variant.mrp > variant.price
      ? Math.round(((variant.mrp - variant.price) / variant.mrp) * 100)
      : 0;

  const handleAdd = () => {
    addItem(
      {
        productId: product.id,
        variantId: variant.id,
        name: product.name,
        variantLabel: variant.label,
        price: variant.price,
        mrp: variant.mrp,
        image: activeImage,
        slug: product.slug,
      },
      qty
    );
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  };

  return (
    <div className="mesh-bg min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/shop"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-body hover:text-emerald-vibrant mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Studio Product Showcase */}
          <div className="lg:col-span-6 space-y-3">
            <div className="rounded-3xl bg-[#F6F7F4] border border-sand p-6 sm:p-10 aspect-square flex items-center justify-center relative overflow-hidden">
              <SafeImage
                src={activeImage}
                fallbackSrc={fallbackImage}
                alt={`${product.name} ${variant.label}`}
                className="max-h-full max-w-full w-auto h-full object-contain transition-all duration-300"
              />

              {product.badge && (
                <span className="absolute top-4 left-4 px-3 py-1 rounded-md text-xs font-bold tracking-wide uppercase bg-emerald-deep text-white shadow-xs">
                  {product.badge}
                </span>
              )}
            </div>

            {/* Variant Thumbnail Selector */}
            {product.variants.length > 1 && (
              <div className="flex flex-wrap gap-2.5">
                {product.variants.map((v, idx) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setSelectedIdx(idx)}
                    className={`w-16 h-16 rounded-xl bg-[#F6F7F4] p-1.5 border flex items-center justify-center cursor-pointer transition-all ${
                      idx === selectedIdx
                        ? "border-emerald-deep ring-2 ring-emerald-deep/20"
                        : "border-sand hover:border-emerald-deep/40"
                    }`}
                    title={v.label}
                  >
                    <SafeImage
                      src={v.image || product.image}
                      fallbackSrc={fallbackImage}
                      alt={v.label}
                      className="max-h-full max-w-full object-contain"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Quick Facts Strip */}
            <div className="mt-4 grid grid-cols-3 gap-2.5 text-center">
              <div className="p-3 rounded-2xl bg-[#F6F7F4] border border-sand">
                <Droplets className="w-4 h-4 text-emerald-vibrant mx-auto mb-1" />
                <p className="text-[11px] font-bold text-charcoal-deep">{variant.label}</p>
                <p className="text-[10px] text-slate-body">Pack Size</p>
              </div>
              <div className="p-3 rounded-2xl bg-[#F6F7F4] border border-sand">
                <Truck className="w-4 h-4 text-emerald-vibrant mx-auto mb-1" />
                <p className="text-[11px] font-bold text-charcoal-deep">Free Delivery</p>
                <p className="text-[10px] text-slate-body">No Minimum Order</p>
              </div>
              <div className="p-3 rounded-2xl bg-[#F6F7F4] border border-sand">
                <ShieldCheck className="w-4 h-4 text-emerald-vibrant mx-auto mb-1" />
                <p className="text-[11px] font-bold text-charcoal-deep">Cash on Delivery</p>
                <p className="text-[10px] text-slate-body">Pay at Doorstep</p>
              </div>
            </div>
          </div>

          {/* Right Column: Pricing, Variant Selector, Add To Bag */}
          <div className="lg:col-span-6 space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 rounded-full bg-mint-light text-xs font-bold text-emerald-vibrant uppercase tracking-wider">
                  {product.categoryName}
                </span>
                <span className="text-xs text-slate-body font-medium">SKU: {variant.sku}</span>
              </div>

              <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-emerald-deep leading-tight">
                {product.name}
              </h1>

              <div className="flex items-center gap-3 mt-3 text-sm">
                <div className="inline-flex items-center gap-1 font-bold text-charcoal-deep">
                  <Star className="w-4 h-4 fill-gold text-gold" />
                  <span>{product.rating.toFixed(1)}</span>
                </div>
                <span className="text-slate-body/40">•</span>
                <span className="text-xs font-semibold text-slate-body">
                  {product.reviewCount} verified reviews
                </span>
                <span className="text-slate-body/40">•</span>
                <span className="text-xs font-bold text-emerald-vibrant">
                  {variant.stock > 0 ? "In Stock" : "Backorder"}
                </span>
              </div>
            </div>

            {/* Pricing Box */}
            <div className="p-5 rounded-3xl glass-panel border border-emerald-deep/10 flex items-baseline justify-between shadow-xs">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-emerald-deep">
                  ₹{variant.price}
                </span>
                {variant.mrp > variant.price && (
                  <span className="text-sm text-slate-body/60 line-through">₹{variant.mrp}</span>
                )}
                {discountPct > 0 && (
                  <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-emerald-vibrant to-mint text-white text-xs font-black">
                    Save {discountPct}%
                  </span>
                )}
              </div>
              <span className="text-xs font-bold text-emerald-vibrant">
                ✓ Free Doorstep Delivery
              </span>
            </div>

            {/* Pack Size Selector */}
            {product.variants.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-body mb-2.5">
                  Select Pack Size
                </p>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v, idx) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setSelectedIdx(idx)}
                      className={`px-4 py-3 rounded-2xl text-xs sm:text-sm font-bold border transition-all cursor-pointer ${
                        idx === selectedIdx
                          ? "bg-emerald-deep text-pearl border-emerald-deep shadow-md scale-102"
                          : "bg-white text-charcoal-deep border-emerald-deep/15 hover:border-mint"
                      }`}
                    >
                      {v.label} — ₹{v.price}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Qty & Add to Bag CTA */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="inline-flex items-center border border-emerald-deep/15 rounded-full bg-white px-2 py-1 shadow-xs">
                <button
                  type="button"
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="p-2.5 text-emerald-deep hover:text-emerald-vibrant cursor-pointer"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-4 font-bold text-sm text-emerald-deep">{qty}</span>
                <button
                  type="button"
                  onClick={() => setQty((q) => q + 1)}
                  className="p-2.5 text-emerald-deep hover:text-emerald-vibrant cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                disabled={variant.stock <= 0}
                onClick={handleAdd}
                className={`flex-1 py-4 px-8 rounded-full font-extrabold text-sm inline-flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg active:scale-95 ${
                  justAdded
                    ? "bg-mint text-emerald-deep"
                    : "bg-emerald-deep text-pearl hover:bg-emerald-vibrant hover:shadow-emerald-vibrant/25"
                }`}
              >
                {justAdded ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Added to Bag!</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4 text-mint-glow" />
                    <span>Add to Bag — ₹{variant.price * qty}</span>
                  </>
                )}
              </button>
            </div>

            {/* Formula Details */}
            <div className="space-y-5 pt-6 border-t border-emerald-deep/10">
              <div>
                <h3 className="font-editorial text-lg font-bold text-emerald-deep mb-1">
                  Product Description
                </h3>
                <p className="text-xs sm:text-sm text-slate-body leading-relaxed font-medium">
                  {product.description}
                </p>
                {product.scent && (
                  <p className="text-xs text-emerald-vibrant font-bold mt-2">
                    Fragrance Profile: {product.scent}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl glass-panel border border-emerald-deep/8">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-deep mb-2 flex items-center gap-1.5">
                    <Droplets className="w-3.5 h-3.5 text-emerald-vibrant" /> Active Ingredients
                  </h4>
                  <ul className="space-y-1 text-xs text-slate-body font-medium">
                    {product.keyIngredients.map((ing) => (
                      <li key={ing} className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-emerald-vibrant shrink-0" />
                        <span>{ing}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl glass-panel border border-emerald-deep/8">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-champagne mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-champagne" /> Formulation Standards
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {product.freeFrom.map((item) => (
                      <span
                        key={item}
                        className="px-2 py-0.5 rounded-full bg-ice text-[10px] font-bold text-emerald-deep"
                      >
                        No {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        {related.length > 0 && (
          <section className="mt-20 pt-10 border-t border-emerald-deep/10">
            <h2 className="font-editorial text-2xl sm:text-3xl font-bold text-emerald-deep mb-8">
              Frequently Paired With
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
