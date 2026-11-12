"use client";

import React, { useState } from "react";
import { Plus, Minus, Sparkles, ShoppingBag, CheckCircle2 } from "lucide-react";
import { Product } from "@/lib/types";
import { useCart } from "@/context/CartContext";
import { SafeImage, getCategoryFallbackImage } from "./SafeImage";

export function BundlesClient({ products }: { products: Product[] }) {
  const { addItem, applyCoupon } = useCart();
  const [selected, setSelected] = useState<
    Array<{ product: Product; variantIdx: number; qty: number }>
  >([]);

  const eligibleProducts = products.filter((p) => p.category !== "crockery-gift-sets");

  const toggleAdd = (product: Product) => {
    setSelected((prev) => {
      const idx = prev.findIndex((i) => i.product.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [...prev, { product, variantIdx: 0, qty: 1 }];
    });
  };

  const updateCount = (productId: string, delta: number) => {
    setSelected((prev) =>
      prev
        .map((item) =>
          item.product.id === productId ? { ...item, qty: item.qty + delta } : item
        )
        .filter((i) => i.qty > 0)
    );
  };

  const totalCount = selected.reduce((sum, i) => sum + i.qty, 0);
  const rawTotal = selected.reduce(
    (sum, i) => sum + (i.product.variants[i.variantIdx]?.price || 0) * i.qty,
    0
  );

  const discountPct = totalCount >= 5 ? 20 : totalCount >= 3 ? 15 : 0;
  const savedAmt = Math.round((rawTotal * discountPct) / 100);
  const finalPrice = rawTotal - savedAmt;

  const handleAddBundleToCart = () => {
    for (const item of selected) {
      const v = item.product.variants[item.variantIdx] || item.product.variants[0];
      addItem(
        {
          productId: item.product.id,
          variantId: v.id,
          name: item.product.name,
          variantLabel: v.label,
          price: v.price,
          mrp: v.mrp,
          image: v.image || item.product.image,
          slug: item.product.slug,
        },
        item.qty
      );
    }
    if (totalCount >= 3) {
      applyCoupon("REFILL15");
    }
    setSelected([]);
  };

  return (
    <div className="mesh-bg min-h-screen py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-mint-light text-emerald-vibrant text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-champagne" />
            <span>Interactive Kit Builder</span>
          </span>
          <h1 className="font-editorial text-3xl sm:text-5xl font-bold text-emerald-deep mt-3">
            Build Your Custom EVOKA Box
          </h1>
          <p className="text-xs sm:text-sm text-slate-body mt-2 font-medium">
            Pick any <strong>3 items to unlock 15% OFF</strong>, or any{" "}
            <strong>5 items for 20% OFF</strong>. Automatic discount applied at checkout.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Product grid */}
          <div className="lg:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {eligibleProducts.map((p) => {
              const v = p.variants[0];
              const inBundle = selected.find((s) => s.product.id === p.id);
              return (
                <div
                  key={p.id}
                  className={`rounded-3xl p-3.5 flex flex-col justify-between transition-all duration-300 ${
                    inBundle
                      ? "bg-white border-2 border-emerald-vibrant shadow-md ring-4 ring-mint/20"
                      : "bg-white border border-emerald-deep/8 hover:border-mint/50 hover:shadow-sm"
                  }`}
                >
                  <div>
                    <div className="aspect-square rounded-xl overflow-hidden bg-[#F6F7F4] p-3 flex items-center justify-center mb-3">
                      <SafeImage
                        src={p.image}
                        fallbackSrc={getCategoryFallbackImage(p.category)}
                        alt={p.name}
                        className="max-h-full max-w-full w-auto h-full object-contain"
                      />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-vibrant block truncate">
                      {p.categoryName}
                    </span>
                    <h3 className="font-bold text-xs sm:text-sm text-emerald-deep line-clamp-2 mt-0.5 leading-snug">
                      {p.name}
                    </h3>
                    <p className="text-[11px] text-slate-body mt-1">{v.label}</p>
                  </div>

                  <div className="mt-4 pt-2 border-t border-emerald-deep/5 flex items-center justify-between">
                    <span className="font-extrabold text-sm text-emerald-deep">₹{v.price}</span>
                    {inBundle ? (
                      <div className="inline-flex items-center border border-emerald-vibrant rounded-full bg-mint-light">
                        <button
                          type="button"
                          onClick={() => updateCount(p.id, -1)}
                          className="p-1.5 text-emerald-deep hover:text-emerald-vibrant cursor-pointer"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 text-xs font-bold text-emerald-deep">
                          {inBundle.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCount(p.id, 1)}
                          className="p-1.5 text-emerald-deep hover:text-emerald-vibrant cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => toggleAdd(p)}
                        className="px-3.5 py-1.5 rounded-full bg-emerald-deep text-pearl text-xs font-bold hover:bg-emerald-vibrant transition-colors cursor-pointer"
                      >
                        + Add
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sticky Milestone Progress Panel */}
          <aside className="lg:col-span-4 rounded-3xl p-6 glass-panel border border-emerald-deep/10 sticky top-24 space-y-5 shadow-lg">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-editorial text-xl font-bold text-emerald-deep">Your Custom Kit</h2>
                <span className="text-xs font-bold text-emerald-vibrant">
                  {totalCount} {totalCount === 1 ? "Item" : "Items"}
                </span>
              </div>

              {/* Progress Milestones */}
              <div className="mt-3 space-y-2">
                <div className="flex justify-between text-[11px] font-bold text-slate-body">
                  <span>Start</span>
                  <span className={totalCount >= 3 ? "text-emerald-vibrant" : ""}>
                    3 Items (15% OFF)
                  </span>
                  <span className={totalCount >= 5 ? "text-champagne font-extrabold" : ""}>
                    5 Items (20% OFF)
                  </span>
                </div>

                <div className="h-2.5 rounded-full bg-ice overflow-hidden border border-emerald-deep/10">
                  <div
                    className="h-full bg-gradient-to-r from-mint to-champagne transition-all duration-500 ease-out"
                    style={{ width: `${Math.min(100, (totalCount / 5) * 100)}%` }}
                  />
                </div>

                <p className="text-[11px] font-semibold text-emerald-deep text-center pt-1">
                  {totalCount < 3
                    ? `Add ${3 - totalCount} more item(s) to unlock 15% OFF`
                    : totalCount < 5
                    ? `🎉 15% OFF unlocked! Add ${5 - totalCount} more for 20% OFF`
                    : "🌟 Maximum 20% Bundle Discount Unlocked!"}
                </p>
              </div>
            </div>

            {selected.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-body bg-ice/60 rounded-2xl border border-dashed border-emerald-deep/15">
                Tap <strong>+ Add</strong> on products to build your kit.
              </div>
            ) : (
              <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {selected.map((s) => (
                  <li
                    key={s.product.id}
                    className="flex justify-between text-xs items-center p-2 rounded-xl bg-white border border-emerald-deep/5"
                  >
                    <span className="font-semibold text-emerald-deep truncate pr-2">
                      {s.qty}× {s.product.name}
                    </span>
                    <span className="font-bold text-slate-body shrink-0">
                      ₹{(s.product.variants[s.variantIdx]?.price || 0) * s.qty}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <div className="border-t border-emerald-deep/10 pt-4 space-y-2 text-xs text-slate-body">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-semibold text-emerald-deep">₹{rawTotal}</span>
              </div>
              {discountPct > 0 && (
                <div className="flex justify-between text-emerald-vibrant font-bold">
                  <span>Bundle Discount ({discountPct}%)</span>
                  <span>-₹{savedAmt}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Doorstep Delivery</span>
                <span className="text-emerald-vibrant font-bold">FREE</span>
              </div>
              <div className="flex justify-between text-lg font-black text-emerald-deep pt-2 border-t border-emerald-deep/10">
                <span>Kit Price</span>
                <span>₹{finalPrice}</span>
              </div>
            </div>

            <button
              type="button"
              disabled={selected.length === 0}
              onClick={handleAddBundleToCart}
              className="w-full py-4 rounded-full bg-emerald-deep text-pearl font-extrabold text-xs sm:text-sm inline-flex items-center justify-center gap-2 hover:bg-emerald-vibrant hover:shadow-lg transition-all disabled:opacity-40 cursor-pointer active:scale-95 group"
            >
              <ShoppingBag className="w-4 h-4 text-mint-glow" />
              <span>Add Kit to Bag (₹{finalPrice})</span>
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}
