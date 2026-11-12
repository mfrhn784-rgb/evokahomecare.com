"use client";

import React, { useState } from "react";
import Link from "next/link";
import { X, Plus, Minus, Trash2, ShoppingBag, Sparkles, ArrowRight, Truck } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { BRAND } from "@/lib/brand";
import { SafeImage } from "./SafeImage";

export function CartDrawer() {
  const {
    items,
    isCartOpen,
    closeCart,
    updateQty,
    removeItem,
    subtotal,
    discount,
    couponCode,
    applyCoupon,
    removeCoupon,
    total,
  } = useCart();

  const [codeInput, setCodeInput] = useState("");
  const [couponMsg, setCouponMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (!isCartOpen) return null;

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const res = applyCoupon(codeInput);
    setCouponMsg({ ok: res.ok, text: res.message });
    if (res.ok) setCodeInput("");
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-emerald-deep/40 backdrop-blur-sm transition-opacity"
        onClick={closeCart}
      />

      <aside className="relative w-full max-w-md bg-pearl h-full flex flex-col shadow-2xl border-l border-emerald-deep/10 z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-6 py-5 border-b border-emerald-deep/10 flex items-center justify-between bg-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-mint-light text-emerald-vibrant flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-editorial font-bold text-emerald-deep text-lg leading-tight">
                Your Shopping Bag
              </h2>
              <p className="text-[11px] text-slate-body font-medium">
                {items.length} {items.length === 1 ? "item" : "items"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeCart}
            className="p-2 rounded-full hover:bg-ice text-slate-body hover:text-emerald-deep transition-colors cursor-pointer"
            aria-label="Close Cart"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Shipping Highlight Bar */}
        <div className="px-6 py-3 bg-gradient-to-r from-mint-light via-ice to-mint-light border-b border-mint/20 flex items-center gap-2">
          <Truck className="w-4 h-4 text-emerald-vibrant shrink-0" />
          <p className="text-xs font-bold text-emerald-deep">
            ✓ 100% FREE Doorstep Delivery on this order!
          </p>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-16">
              <div className="w-16 h-16 rounded-full bg-ice flex items-center justify-center mb-4 text-emerald-vibrant">
                <Sparkles className="w-8 h-8 text-mint" />
              </div>
              <h3 className="font-editorial font-bold text-emerald-deep text-xl mb-1">
                Your bag is empty
              </h3>
              <p className="text-xs text-slate-body max-w-xs mb-6 font-medium">
                Explore laundry liquids, dish wash gels, floor cleaners, and hand washes.
              </p>
              <Link
                href="/shop"
                onClick={closeCart}
                className="px-6 py-3 rounded-full bg-emerald-deep text-pearl text-xs font-bold hover:bg-emerald-vibrant transition-all shadow-sm"
              >
                Browse Catalog
              </Link>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={`${item.productId}-${item.variantId}`}
                className="flex gap-3.5 p-3.5 rounded-2xl bg-white border border-emerald-deep/8 shadow-xs hover:border-mint/40 transition-all"
              >
                <SafeImage
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 rounded-xl object-contain bg-[#F6F7F4] p-1.5 border border-sand shrink-0"
                />
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={closeCart}
                      className="font-bold text-xs sm:text-sm text-emerald-deep hover:text-emerald-vibrant line-clamp-2 leading-snug"
                    >
                      {item.name}
                    </Link>
                    <p className="text-[11px] text-slate-body mt-0.5 font-medium">
                      {item.variantLabel}
                    </p>
                  </div>

                  <div className="mt-2.5 flex items-center justify-between">
                    <div className="inline-flex items-center border border-emerald-deep/15 rounded-full bg-ice">
                      <button
                        type="button"
                        onClick={() => updateQty(item.productId, item.variantId, item.quantity - 1)}
                        className="p-1.5 text-emerald-deep hover:text-emerald-vibrant cursor-pointer"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="px-2.5 text-xs font-bold text-emerald-deep">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.productId, item.variantId, item.quantity + 1)}
                        className="p-1.5 text-emerald-deep hover:text-emerald-vibrant cursor-pointer"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="font-extrabold text-sm text-emerald-deep">
                        ₹{item.price * item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(item.productId, item.variantId)}
                        className="text-slate-body/50 hover:text-red-600 p-1 cursor-pointer transition-colors"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer / Totals */}
        {items.length > 0 && (
          <div className="p-6 bg-white border-t border-emerald-deep/10 space-y-4 shadow-lg">
            {/* Coupon Box */}
            {couponCode ? (
              <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-mint-light text-emerald-deep text-xs font-bold">
                <span>
                  Coupon <strong>{couponCode}</strong> applied (-₹{discount})
                </span>
                <button
                  type="button"
                  onClick={removeCoupon}
                  className="text-emerald-vibrant underline hover:text-emerald-deep cursor-pointer"
                >
                  Remove
                </button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="Coupon code (EVOKA10)"
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl bg-ice border border-emerald-deep/15 focus:outline-none focus:border-emerald-vibrant"
                />
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-deep text-pearl hover:bg-emerald-vibrant transition-colors cursor-pointer"
                >
                  Apply
                </button>
              </form>
            )}
            {couponMsg && (
              <p className={`text-xs ${couponMsg.ok ? "text-emerald-vibrant font-bold" : "text-red-500"}`}>
                {couponMsg.text}
              </p>
            )}

            <div className="space-y-1.5 text-xs text-slate-body pt-1">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-emerald-deep">₹{subtotal}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-vibrant font-bold">
                  <span>Discount ({couponCode})</span>
                  <span>-₹{discount}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Delivery</span>
                <span className="text-emerald-vibrant font-bold">FREE</span>
              </div>
              <div className="flex justify-between text-base font-black text-emerald-deep pt-2 border-t border-emerald-deep/10">
                <span>Total Amount</span>
                <span>₹{total}</span>
              </div>
            </div>

            <Link
              href="/checkout"
              onClick={closeCart}
              className="w-full py-4 px-6 rounded-full bg-emerald-deep text-pearl font-extrabold text-sm flex items-center justify-center gap-2 hover:bg-emerald-vibrant hover:shadow-lg transition-all cursor-pointer active:scale-95 group"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4 text-mint-glow group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
