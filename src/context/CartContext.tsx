"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { CartItem } from "@/lib/types";
import { BRAND, COUPONS } from "@/lib/brand";

interface CartContextValue {
  items: CartItem[];
  isCartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  updateQty: (productId: string, variantId: string, qty: number) => void;
  removeItem: (productId: string, variantId: string) => void;
  clearCart: () => void;
  couponCode: string;
  applyCoupon: (code: string) => { ok: boolean; message: string };
  removeCoupon: () => void;
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  totalItems: number;
}

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "evoka_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [couponCode, setCouponCode] = useState<string>("");
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<
    Record<string, { discountPercent: number; minOrder: number; label: string }>
  >(COUPONS);

  useEffect(() => {
    fetch("/api/coupons")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.effective) {
          setAvailableCoupons(data.effective);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.items)) setItems(parsed.items);
        if (typeof parsed.couponCode === "string") setCouponCode(parsed.couponCode);
      }
    } catch {
      // ignore storage errors
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ items, couponCode }));
    } catch {
      // ignore
    }
  }, [items, couponCode, hydrated]);

  const addItem = (incoming: Omit<CartItem, "quantity">, qty = 1) => {
    setItems((prev) => {
      const idx = prev.findIndex(
        (i) => i.productId === incoming.productId && i.variantId === incoming.variantId
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + qty };
        return next;
      }
      return [...prev, { ...incoming, quantity: qty }];
    });
    setIsCartOpen(true);
  };

  const updateQty = (productId: string, variantId: string, qty: number) => {
    if (qty <= 0) {
      removeItem(productId, variantId);
      return;
    }
    setItems((prev) =>
      prev.map((i) =>
        i.productId === productId && i.variantId === variantId ? { ...i, quantity: qty } : i
      )
    );
  };

  const removeItem = (productId: string, variantId: string) => {
    setItems((prev) =>
      prev.filter((i) => !(i.productId === productId && i.variantId === variantId))
    );
  };

  const clearCart = () => {
    setItems([]);
    setCouponCode("");
  };

  const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);

  const couponObj = couponCode ? availableCoupons[couponCode.toUpperCase()] : undefined;
  const discount =
    couponObj && subtotal >= couponObj.minOrder
      ? Math.round((subtotal * couponObj.discountPercent) / 100)
      : 0;

  const afterDiscount = Math.max(0, subtotal - discount);
  const shippingFee = 0; // Free delivery on all EVOKA orders
  const total = afterDiscount + shippingFee;

  const applyCoupon = (raw: string) => {
    const code = raw.trim().toUpperCase();
    const found = availableCoupons[code];
    if (!found) {
      return { ok: false, message: "Invalid coupon code." };
    }
    if (subtotal < found.minOrder) {
      return { ok: false, message: `Add ₹${found.minOrder - subtotal} more to unlock ${code}.` };
    }
    setCouponCode(code);
    return { ok: true, message: `${code} applied (${found.discountPercent}% off)!` };
  };

  const removeCoupon = () => setCouponCode("");

  return (
    <CartContext.Provider
      value={{
        items,
        isCartOpen,
        openCart: () => setIsCartOpen(true),
        closeCart: () => setIsCartOpen(false),
        addItem,
        updateQty,
        removeItem,
        clearCart,
        couponCode,
        applyCoupon,
        removeCoupon,
        subtotal,
        discount,
        shippingFee,
        total,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
