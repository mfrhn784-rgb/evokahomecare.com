"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  CreditCard,
  Truck,
  Store,
  MessageCircle,
  Banknote,
  Lock,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { BRAND } from "@/lib/brand";
import { Order, PaymentMethod } from "@/lib/types";
import { SafeImage } from "@/components/SafeImage";

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function CheckoutPage() {
  const { items, subtotal, discount, couponCode, total, clearCart } = useCart();

  const [fulfillmentType, setFulfillmentType] = useState<"delivery" | "pickup">("delivery");
  const [pickupOutlet, setPickupOutlet] = useState<string>(BRAND.outlets[0].name);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cod");

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [line1, setLine1] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("Thiruvananthapuram");
  const [state, setState] = useState("Kerala");
  const [pincode, setPincode] = useState("");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);

  const effectiveShipping = 0;
  const effectiveTotal = Math.max(0, subtotal - discount) + effectiveShipping;

  const submitFinalOrder = async (paymentId?: string) => {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerName,
        phone,
        email,
        fulfillmentType,
        pickupOutlet: fulfillmentType === "pickup" ? pickupOutlet : undefined,
        address: { line1, landmark, city, state, pincode },
        items,
        couponCode,
        paymentMethod,
        paymentId,
        notes,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Could not place order");
    }

    const order = data.order as Order;
    setConfirmedOrder(order);
    clearCart();

    if (paymentMethod === "whatsapp") {
      const summary = order.items
        .map((i) => `• ${i.name} (${i.variantLabel}) x ${i.quantity} = ₹${i.price * i.quantity}`)
        .join("\n");
      const msg = `Hello EVOKA! I just placed order *${order.id}*:\n\n${summary}\n\nDelivery: FREE\nTotal: *₹${order.total}*\nName: ${order.customerName}\nPhone: ${order.phone}\nType: ${
        order.fulfillmentType === "pickup"
          ? `Store Pickup (${order.pickupOutlet})`
          : `Delivery to ${order.address.line1}, ${order.address.city} - ${order.address.pincode}`
      }`;
      window.open(`${BRAND.whatsappUrl}?text=${encodeURIComponent(msg)}`, "_blank");
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const phoneDigits = phone.replace(/\D/g, "");
    if (!customerName.trim() || phoneDigits.length < 10) {
      setError("Please enter your full name and a valid 10-digit mobile number.");
      return;
    }
    if (fulfillmentType === "delivery" && (!line1.trim() || !/^\d{6}$/.test(pincode.trim()))) {
      setError("Please enter your delivery address and a valid 6-digit PIN code.");
      return;
    }

    setSubmitting(true);
    try {
      await submitFinalOrder();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedOrder) {
    const cleanPhone = confirmedOrder.phone.replace(/\D/g, "").slice(-10);
    return (
      <div className="mesh-bg min-h-screen py-16">
        <div className="max-w-2xl mx-auto px-4">
          <div className="glass-panel rounded-[36px] border border-emerald-deep/10 p-8 sm:p-12 text-center space-y-6 shadow-xl">
            <div className="w-16 h-16 rounded-full bg-mint-light text-emerald-vibrant flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div>
              <span className="text-xs uppercase tracking-widest text-emerald-vibrant font-extrabold">
                Order Placed Successfully
              </span>
              <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-emerald-deep mt-1">
                Thank you, {confirmedOrder.customerName}!
              </h1>
              <p className="text-xs sm:text-sm text-slate-body mt-2 font-medium">
                Your EVOKA Order ID is{" "}
                <strong className="text-emerald-deep">{confirmedOrder.id}</strong>
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 text-left text-xs sm:text-sm space-y-2.5 border border-emerald-deep/5">
              <div className="flex justify-between">
                <span className="text-slate-body">Fulfillment</span>
                <span className="font-bold text-emerald-deep">
                  {confirmedOrder.fulfillmentType === "pickup"
                    ? `Store Pickup — ${confirmedOrder.pickupOutlet}`
                    : `Free Home Delivery (${confirmedOrder.address.pincode})`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-body">Payment Method</span>
                <span className="font-bold text-emerald-deep">
                  {confirmedOrder.paymentStatus} ({confirmedOrder.paymentMethod.toUpperCase()})
                </span>
              </div>
              <div className="flex justify-between border-t border-emerald-deep/10 pt-2 font-black text-base text-emerald-deep">
                <span>Total Payable</span>
                <span>₹{confirmedOrder.total}</span>
              </div>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-2">
              <Link
                href={`/orders?id=${confirmedOrder.id}&phone=${cleanPhone}`}
                className="px-7 py-3.5 rounded-full bg-emerald-deep text-pearl text-xs font-bold hover:bg-emerald-vibrant shadow-md transition-all"
              >
                Manage / Track Order
              </Link>
              <Link
                href="/shop"
                className="px-7 py-3.5 rounded-full bg-white border border-emerald-deep/20 text-emerald-deep text-xs font-bold hover:bg-ice transition-all"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mesh-bg min-h-screen py-24">
        <div className="max-w-xl mx-auto px-4 text-center space-y-4">
          <h1 className="font-editorial text-3xl font-bold text-emerald-deep">
            Your Shopping Bag is Empty
          </h1>
          <p className="text-xs sm:text-sm text-slate-body font-medium">
            Add EVOKA home and personal care products before checking out.
          </p>
          <Link
            href="/shop"
            className="inline-block px-7 py-3.5 rounded-full bg-emerald-deep text-pearl text-xs font-bold hover:bg-emerald-vibrant transition-all shadow-sm"
          >
            Go to Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mesh-bg min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/shop"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-body hover:text-emerald-vibrant mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Continue Shopping
        </Link>

        <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-emerald-deep mb-8">
          Secure Checkout
        </h1>

        <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Input Details */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Fulfillment Mode */}
            <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4 border border-emerald-deep/10 shadow-xs">
              <h2 className="font-editorial text-xl font-bold text-emerald-deep">
                1. Delivery or Free Outlet Pickup
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFulfillmentType("delivery")}
                  className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 cursor-pointer transition-all ${
                    fulfillmentType === "delivery"
                      ? "border-emerald-vibrant bg-white shadow-sm ring-2 ring-mint/20"
                      : "border-emerald-deep/10 bg-white/60"
                  }`}
                >
                  <Truck className="w-5 h-5 text-emerald-vibrant shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-emerald-deep">Free Doorstep Delivery</p>
                    <p className="text-[11px] text-emerald-vibrant font-semibold">
                      ₹0 shipping on all orders
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFulfillmentType("pickup")}
                  className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 cursor-pointer transition-all ${
                    fulfillmentType === "pickup"
                      ? "border-emerald-vibrant bg-white shadow-sm ring-2 ring-mint/20"
                      : "border-emerald-deep/10 bg-white/60"
                  }`}
                >
                  <Store className="w-5 h-5 text-emerald-vibrant shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-emerald-deep">Free Outlet Pickup</p>
                    <p className="text-[11px] text-slate-body">Poovar Uchakkada or Pallichal Jn</p>
                  </div>
                </button>
              </div>

              {fulfillmentType === "pickup" && (
                <div className="pt-2 space-y-1.5">
                  <label className="block text-xs font-bold text-slate-body uppercase tracking-wider">
                    Select Pickup Outlet in Trivandrum
                  </label>
                  <select
                    value={pickupOutlet}
                    onChange={(e) => setPickupOutlet(e.target.value)}
                    className="w-full px-4 py-3 rounded-2xl bg-white border border-emerald-deep/15 text-xs sm:text-sm font-semibold text-emerald-deep"
                  >
                    {BRAND.outlets.map((o) => (
                      <option key={o.id} value={o.name}>
                        {o.name} — {o.address}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 2. Customer & Address Details */}
            <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4 border border-emerald-deep/10 shadow-xs">
              <h2 className="font-editorial text-xl font-bold text-emerald-deep">
                2. Contact &amp; Shipping Address
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-body mb-1">Full Name *</label>
                  <input
                    required
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Ananya Nair"
                    className="w-full px-4 py-3 rounded-2xl bg-white border border-emerald-deep/15 text-xs sm:text-sm focus:outline-none focus:border-emerald-vibrant"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-body mb-1">
                    10-Digit Mobile / WhatsApp *
                  </label>
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9876543210"
                    className="w-full px-4 py-3 rounded-2xl bg-white border border-emerald-deep/15 text-xs sm:text-sm focus:outline-none focus:border-emerald-vibrant"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-body mb-1">
                  Email Address (optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-emerald-deep/15 text-xs sm:text-sm focus:outline-none focus:border-emerald-vibrant"
                />
              </div>

              {fulfillmentType === "delivery" && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-body mb-1">
                      House / Flat / Street Address *
                    </label>
                    <input
                      required
                      type="text"
                      value={line1}
                      onChange={(e) => setLine1(e.target.value)}
                      placeholder="House No, Street, Locality"
                      className="w-full px-4 py-3 rounded-2xl bg-white border border-emerald-deep/15 text-xs sm:text-sm focus:outline-none focus:border-emerald-vibrant"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-body mb-1">City</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-white border border-emerald-deep/15 text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-body mb-1">State</label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        className="w-full px-4 py-3 rounded-2xl bg-white border border-emerald-deep/15 text-xs sm:text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-body mb-1">6-Digit PIN *</label>
                      <input
                        required
                        type="text"
                        maxLength={6}
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="695020"
                        className="w-full px-4 py-3 rounded-2xl bg-white border border-emerald-deep/15 text-xs sm:text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-body mb-1">
                      Landmark (optional)
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="Near Pallichal Junction..."
                      className="w-full px-4 py-3 rounded-2xl bg-white border border-emerald-deep/15 text-xs sm:text-sm"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-body mb-1">
                  Delivery Note (optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Gate code, call before delivery, etc."
                  className="w-full px-4 py-3 rounded-2xl bg-white border border-emerald-deep/15 text-xs sm:text-sm"
                />
              </div>
            </div>

            {/* 3. Payment Method */}
            <div className="glass-panel rounded-3xl p-6 sm:p-8 space-y-4 border border-emerald-deep/10 shadow-xs">
              <h2 className="font-editorial text-xl font-bold text-emerald-deep">
                3. Payment Method
              </h2>
              <div className="space-y-3">
                <label
                  className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === "cod"
                      ? "border-emerald-vibrant bg-white shadow-sm ring-2 ring-mint/20"
                      : "border-emerald-deep/10 bg-white/60"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                    className="mt-1 accent-emerald-vibrant"
                  />
                  <Banknote className="w-5 h-5 text-emerald-vibrant shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-emerald-deep">
                      Cash on Delivery / Doorstep UPI QR
                    </p>
                    <p className="text-xs text-slate-body">
                      Pay comfortably via cash or scan UPI QR when EVOKA arrives at your home.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3.5 p-4 rounded-2xl border cursor-pointer transition-all ${
                    paymentMethod === "whatsapp"
                      ? "border-emerald-vibrant bg-white shadow-sm ring-2 ring-mint/20"
                      : "border-emerald-deep/10 bg-white/60"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "whatsapp"}
                    onChange={() => setPaymentMethod("whatsapp")}
                    className="mt-1 accent-emerald-vibrant"
                  />
                  <MessageCircle className="w-5 h-5 text-emerald-vibrant shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-emerald-deep">Confirm via WhatsApp</p>
                    <p className="text-xs text-slate-body">
                      Places your order and opens WhatsApp ({BRAND.phone}) to confirm delivery slot.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <aside className="lg:col-span-5 glass-panel rounded-3xl p-6 sm:p-8 border border-emerald-deep/10 sticky top-24 space-y-6 shadow-xl">
            <h2 className="font-editorial text-xl font-bold text-emerald-deep">Order Summary</h2>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={`${item.productId}-${item.variantId}`} className="flex gap-3 items-center">
                  <SafeImage
                    src={item.image}
                    alt={item.name}
                    className="w-14 h-14 rounded-2xl object-contain p-1.5 bg-[#F6F7F4] shrink-0 border border-[#E5E8E3]"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-emerald-deep truncate">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-slate-body font-medium">
                      {item.variantLabel} × {item.quantity}
                    </p>
                  </div>
                  <span className="text-xs sm:text-sm font-extrabold text-emerald-deep">
                    ₹{item.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-emerald-deep/10 pt-4 space-y-2 text-xs sm:text-sm text-slate-body">
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
              <div className="flex justify-between text-emerald-vibrant font-bold">
                <span>{fulfillmentType === "pickup" ? "Outlet Pickup" : "Doorstep Delivery"}</span>
                <span>FREE</span>
              </div>
              <div className="flex justify-between text-lg font-black text-emerald-deep pt-2 border-t border-emerald-deep/10">
                <span>Total Amount</span>
                <span>₹{total}</span>
              </div>
            </div>

            {error && (
              <p className="p-3.5 rounded-2xl bg-red-50 text-red-600 text-xs font-bold border border-red-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-full bg-emerald-deep text-pearl font-extrabold text-sm inline-flex items-center justify-center gap-2 hover:bg-emerald-vibrant hover:shadow-lg transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              <Lock className="w-4 h-4 text-mint-glow" />
              <span>{submitting ? "Placing Order..." : `Confirm Order (₹${effectiveTotal})`}</span>
            </button>
            <p className="text-[10px] text-center text-slate-body font-medium">
              ✓ Guaranteed free delivery • Secure server price verification
            </p>
          </aside>
        </form>
      </div>
    </div>
  );
}
