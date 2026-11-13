"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import {
  CheckCircle2,
  Truck,
  Store,
  MessageCircle,
  Banknote,
  Lock,
  ArrowLeft,
  QrCode,
  Copy,
  Check,
  Upload,
  X,
  AlertCircle,
  UserCheck,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { BRAND } from "@/lib/brand";
import { CustomerAddress, Order } from "@/lib/types";
import { SafeImage } from "@/components/SafeImage";
import {
  clearSavedProfile,
  loadSavedProfile,
  saveCustomerProfile,
  saveOrderRef,
} from "@/lib/customer-storage";

function buildWhatsAppOrderMessage(order: Order): string {
  const summary = order.items
    .map((i) => `• ${i.name} (${i.variantLabel}) x ${i.quantity} = ₹${i.price * i.quantity}`)
    .join("\n");

  const deliveryLine =
    order.fulfillmentType === "pickup"
      ? `Store Pickup: ${order.pickupOutlet}`
      : `Delivery: ${order.address.line1}${
          order.address.landmark ? ` (${order.address.landmark})` : ""
        }, ${order.address.city}, ${order.address.state} - ${order.address.pincode}`;

  const paymentLine =
    order.paymentMethod === "upi"
      ? `Payment: UPI Prepaid\nUPI Reference: ${order.upiReference || "N/A"}\nPayment Status: ${order.paymentStatus}`
      : `Payment: Cash on Delivery (COD)\nPayment Status: ${order.paymentStatus}`;

  return [
    `Hello EVOKA! New Order Placed:`,
    `Order ID: *${order.id}*`,
    `Customer: ${order.customerName} (${order.phone})`,
    deliveryLine,
    ``,
    `Items:`,
    summary,
    ``,
    `Subtotal: ₹${order.subtotal}`,
    order.discount > 0 ? `Discount: -₹${order.discount}` : null,
    `Delivery Charges: FREE`,
    `Total Amount: *₹${order.total}*`,
    ``,
    paymentLine,
    order.notes ? `Note: ${order.notes}` : null,
  ]
    .filter((l) => l !== null)
    .join("\n");
}

export default function CheckoutPage() {
  const { items, subtotal, discount, couponCode, clearCart } = useCart();

  const [fulfillmentType, setFulfillmentType] = useState<"delivery" | "pickup">("delivery");
  const [pickupOutlet, setPickupOutlet] = useState<string>(BRAND.outlets[0].name);
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "cod">("upi");

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [line1, setLine1] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("Thiruvananthapuram");
  const [state, setState] = useState("Kerala");
  const [pincode, setPincode] = useState("");
  const [notes, setNotes] = useState("");

  // UPI Prepaid state
  const [upiReference, setUpiReference] = useState("");
  const [paymentScreenshot, setPaymentScreenshot] = useState("");
  const [uploadingProof, setUploadingProof] = useState(false);
  const [proofError, setProofError] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  // Idempotency key to prevent duplicate submissions
  const [clientRequestId] = useState(
    () => `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [confirmedOrder, setConfirmedOrder] = useState<Order | null>(null);
  const [profileHydrated, setProfileHydrated] = useState(false);
  const [loadedFromSaved, setLoadedFromSaved] = useState(false);

  // Auto-load saved customer details on mount using clean localStorage
  useEffect(() => {
    const saved = loadSavedProfile();
    if (saved) {
      if (saved.customerName) setCustomerName(saved.customerName);
      if (saved.phone) setPhone(saved.phone);
      if (saved.email) setEmail(saved.email);
      if (saved.fulfillmentType) setFulfillmentType(saved.fulfillmentType);
      if (saved.pickupOutlet) setPickupOutlet(saved.pickupOutlet);
      if (saved.line1) setLine1(saved.line1);
      if (saved.landmark) setLandmark(saved.landmark);
      if (saved.city) setCity(saved.city);
      if (saved.state) setState(saved.state);
      if (saved.pincode) setPincode(saved.pincode);
      if (saved.notes) setNotes(saved.notes);
      if (saved.paymentMethod) setPaymentMethod(saved.paymentMethod);
      if (saved.customerName || saved.phone || saved.line1) {
        setLoadedFromSaved(true);
      }
    }
    setProfileHydrated(true);
  }, []);

  // Auto-save customer details as they type or update preferences
  useEffect(() => {
    if (!profileHydrated) return;
    if (!customerName && !phone && !line1 && !pincode) return;
    const timer = setTimeout(() => {
      saveCustomerProfile({
        customerName,
        phone,
        email,
        fulfillmentType,
        pickupOutlet,
        line1,
        landmark,
        city,
        state,
        pincode,
        notes,
        paymentMethod,
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [
    profileHydrated,
    customerName,
    phone,
    email,
    fulfillmentType,
    pickupOutlet,
    line1,
    landmark,
    city,
    state,
    pincode,
    notes,
    paymentMethod,
  ]);

  const handleClearSavedDetails = () => {
    clearSavedProfile();
    setLoadedFromSaved(false);
    setCustomerName("");
    setPhone("");
    setEmail("");
    setLine1("");
    setLandmark("");
    setPincode("");
    setNotes("");
  };

  const effectiveShipping = 0;
  const effectiveTotal = Math.max(0, subtotal - discount) + effectiveShipping;

  const upiPayUri = useMemo(() => {
    const params = new URLSearchParams({
      pa: BRAND.upi.id,
      pn: BRAND.upi.payeeName,
      am: effectiveTotal.toFixed(2),
      cu: "INR",
      tn: "EVOKA Home Care Order",
    });
    return `upi://pay?${params.toString()}`;
  }, [effectiveTotal]);

  useEffect(() => {
    if (BRAND.upi.qrImage || effectiveTotal <= 0) return;
    let cancelled = false;
    QRCode.toDataURL(upiPayUri, {
      width: 220,
      margin: 2,
      color: { dark: "#121614", light: "#FFFFFF" },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl("");
      });
    return () => {
      cancelled = true;
    };
  }, [upiPayUri, effectiveTotal]);

  const handleCopyUpi = async () => {
    try {
      await navigator.clipboard.writeText(BRAND.upi.id);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProofError("");
    setUploadingProof(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/orders/upload-proof", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setProofError(data.error || "Could not upload screenshot.");
      } else if (data.url) {
        setPaymentScreenshot(data.url);
      }
    } catch {
      setProofError("Network error uploading screenshot.");
    } finally {
      setUploadingProof(false);
    }
  };

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
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
    if (paymentMethod === "upi" && !paymentScreenshot) {
      setError("Payment screenshot is mandatory for UPI orders. Please upload your payment screenshot before placing order.");
      setProofError("Payment screenshot is mandatory.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientRequestId,
          customerName,
          phone,
          email,
          fulfillmentType,
          pickupOutlet: fulfillmentType === "pickup" ? pickupOutlet : undefined,
          address: { line1, landmark, city, state, pincode },
          items,
          couponCode,
          paymentMethod,
          upiReference: paymentMethod === "upi" ? upiReference.trim() : undefined,
          paymentScreenshot: paymentMethod === "upi" && paymentScreenshot ? paymentScreenshot : undefined,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Could not place order");
      }

      const order = data.order as Order;
      saveOrderRef(order);
      saveCustomerProfile({
        customerName,
        phone,
        email,
        fulfillmentType,
        pickupOutlet,
        line1,
        landmark,
        city,
        state,
        pincode,
        notes,
        paymentMethod,
      });
      setConfirmedOrder(order);
      clearCart();

      const waMsg = buildWhatsAppOrderMessage(order);
      window.open(`${BRAND.whatsappUrl}?text=${encodeURIComponent(waMsg)}`, "_blank", "noopener");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Order failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmedOrder) {
    const cleanPhone = confirmedOrder.phone.replace(/\D/g, "").slice(-10);
    const waHref = `${BRAND.whatsappUrl}?text=${encodeURIComponent(
      buildWhatsAppOrderMessage(confirmedOrder)
    )}`;
    return (
      <div className="bg-[#F9FAF8] min-h-screen py-14">
        <div className="max-w-2xl mx-auto px-4">
          <div className="bg-white rounded-2xl border border-[#E5E8E3] p-7 sm:p-10 text-center space-y-6 shadow-sm">
            <div className="w-14 h-14 rounded-full bg-[#E8F3EE] text-[#184D3B] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <span className="text-xs uppercase tracking-widest text-[#184D3B] font-bold">
                Order Recorded
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#121614] mt-1">
                Thank you, {confirmedOrder.customerName}!
              </h1>
              <p className="text-sm text-[#5C6661] mt-1.5">
                Order ID: <strong className="text-[#121614]">{confirmedOrder.id}</strong>
              </p>
            </div>

            <div className="bg-[#F9FAF8] rounded-xl p-5 text-left text-xs sm:text-sm space-y-2.5 border border-[#E5E8E3]">
              <div className="flex justify-between gap-4">
                <span className="text-[#5C6661]">Order Status</span>
                <span className="font-bold text-[#121614]">{confirmedOrder.status}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#5C6661]">Payment Method</span>
                <span className="font-bold text-[#121614]">
                  {confirmedOrder.paymentMethod === "upi" ? "UPI Prepaid" : "Cash on Delivery (COD)"}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-[#5C6661]">Payment Status</span>
                <span className="font-bold text-[#184D3B]">{confirmedOrder.paymentStatus}</span>
              </div>
              {confirmedOrder.upiReference && (
                <div className="flex justify-between gap-4">
                  <span className="text-[#5C6661]">UPI Reference</span>
                  <span className="font-mono font-bold text-[#121614]">
                    {confirmedOrder.upiReference}
                  </span>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <span className="text-[#5C6661]">Fulfillment</span>
                <span className="font-semibold text-[#121614] text-right">
                  {confirmedOrder.fulfillmentType === "pickup"
                    ? `Store Pickup — ${confirmedOrder.pickupOutlet}`
                    : `Free Home Delivery (${confirmedOrder.address.pincode})`}
                </span>
              </div>
              <div className="flex justify-between border-t border-[#E5E8E3] pt-2.5 font-bold text-base text-[#121614]">
                <span>Total Amount</span>
                <span>₹{confirmedOrder.total}</span>
              </div>
            </div>

            <div className="bg-[#E8F3EE]/60 border border-[#184D3B]/15 rounded-xl p-4 text-left space-y-3">
              <div className="flex items-start gap-2.5">
                <MessageCircle className="w-5 h-5 text-[#184D3B] shrink-0 mt-0.5" />
                <div className="text-xs text-[#121614] space-y-1">
                  <p className="font-bold">Send Order Summary on WhatsApp</p>
                  <p className="text-[#5C6661]">
                    WhatsApp does not send messages automatically. Please tap{" "}
                    <strong>Send</strong> in the WhatsApp window to share your order summary with EVOKA.
                  </p>
                </div>
              </div>
              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-[#25D366] hover:bg-[#1ebe57] text-white text-xs font-bold inline-flex items-center justify-center gap-2 transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Open WhatsApp &amp; Tap Send</span>
              </a>
            </div>

            <div className="flex flex-wrap justify-center gap-3 pt-1">
              <Link
                href={`/orders?id=${confirmedOrder.id}&phone=${cleanPhone}`}
                className="px-6 py-3 rounded-xl bg-[#184D3B] text-white text-xs font-bold hover:bg-[#12382B] transition-all"
              >
                Manage / Track Order
              </Link>
              <Link
                href="/shop"
                className="px-6 py-3 rounded-xl bg-white border border-[#E5E8E3] text-[#121614] text-xs font-bold hover:bg-[#F4F6F4] transition-all"
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
      <div className="bg-[#F9FAF8] min-h-screen py-24">
        <div className="max-w-xl mx-auto px-4 text-center space-y-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#121614]">
            Your Shopping Bag is Empty
          </h1>
          <p className="text-sm text-[#5C6661]">
            Add EVOKA home and personal care products before checking out.
          </p>
          <Link
            href="/shop"
            className="inline-block px-7 py-3 rounded-xl bg-[#184D3B] text-white text-xs font-bold hover:bg-[#12382B] transition-all"
          >
            Go to Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F9FAF8] min-h-screen py-8 sm:py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          href="/shop"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-[#5C6661] hover:text-[#184D3B] mb-5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Continue Shopping
        </Link>

        <h1 className="text-2xl sm:text-3xl font-bold text-[#121614] mb-6">
          Secure Checkout &amp; Billing
        </h1>

        <form onSubmit={handleCheckout} className="grid grid-cols-1 lg:grid-cols-12 gap-7 items-start">
          {/* Left: Delivery & Payment */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Fulfillment Mode */}
            <div className="bg-white rounded-2xl p-6 space-y-4 border border-[#E5E8E3]">
              <h2 className="text-base sm:text-lg font-bold text-[#121614]">
                1. Delivery or Free Outlet Pickup
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFulfillmentType("delivery")}
                  className={`p-4 rounded-xl border text-left flex items-start gap-3 cursor-pointer transition-all ${
                    fulfillmentType === "delivery"
                      ? "border-[#184D3B] bg-[#F4F8F6] ring-1 ring-[#184D3B]"
                      : "border-[#E5E8E3] bg-white"
                  }`}
                >
                  <Truck className="w-5 h-5 text-[#184D3B] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-[#121614]">Free Doorstep Delivery</p>
                    <p className="text-[11px] text-[#184D3B] font-semibold">
                      ₹0 shipping on all orders
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFulfillmentType("pickup")}
                  className={`p-4 rounded-xl border text-left flex items-start gap-3 cursor-pointer transition-all ${
                    fulfillmentType === "pickup"
                      ? "border-[#184D3B] bg-[#F4F8F6] ring-1 ring-[#184D3B]"
                      : "border-[#E5E8E3] bg-white"
                  }`}
                >
                  <Store className="w-5 h-5 text-[#184D3B] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-[#121614]">Free Outlet Pickup</p>
                    <p className="text-[11px] text-[#5C6661]">Poovar Uchakkada or Pallichal Jn</p>
                  </div>
                </button>
              </div>

              {fulfillmentType === "pickup" && (
                <div className="pt-1 space-y-1.5">
                  <label className="block text-xs font-bold text-[#5C6661] uppercase tracking-wider">
                    Select Pickup Outlet in Trivandrum
                  </label>
                  <select
                    value={pickupOutlet}
                    onChange={(e) => setPickupOutlet(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white border border-[#E5E8E3] text-xs sm:text-sm font-semibold text-[#121614]"
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

            {/* 2. Contact & Address Details */}
            <div className="bg-white rounded-2xl p-6 space-y-4 border border-[#E5E8E3]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-base sm:text-lg font-bold text-[#121614]">
                  2. Contact &amp; Billing Address
                </h2>
                {loadedFromSaved && (
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#EBF5EE] border border-[#184D3B]/15 text-[11px] font-semibold text-[#184D3B]">
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Saved details auto-filled</span>
                    <button
                      type="button"
                      onClick={handleClearSavedDetails}
                      className="ml-1 underline text-[#5C6661] hover:text-red-600 cursor-pointer"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#5C6661] mb-1">Full Name *</label>
                  <input
                    required
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E8E3] text-sm focus:outline-none focus:border-[#184D3B]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#5C6661] mb-1">
                    10-Digit Mobile / WhatsApp *
                  </label>
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Enter 10-digit mobile number"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E8E3] text-sm focus:outline-none focus:border-[#184D3B]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5C6661] mb-1">
                  Email Address (optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address (optional)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E8E3] text-sm focus:outline-none focus:border-[#184D3B]"
                />
              </div>

              {fulfillmentType === "delivery" && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-[#5C6661] mb-1">
                      House / Flat / Street Address *
                    </label>
                    <input
                      required
                      type="text"
                      value={line1}
                      onChange={(e) => setLine1(e.target.value)}
                      placeholder="House / flat / street / building address"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E8E3] text-sm focus:outline-none focus:border-[#184D3B]"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#5C6661] mb-1">City</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="City / District"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E8E3] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#5C6661] mb-1">State</label>
                      <input
                        type="text"
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                        placeholder="State"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E8E3] text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#5C6661] mb-1">6-Digit PIN *</label>
                      <input
                        required
                        type="text"
                        maxLength={6}
                        value={pincode}
                        onChange={(e) => setPincode(e.target.value)}
                        placeholder="Postal PIN code"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E8E3] text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#5C6661] mb-1">
                      Landmark (optional)
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="Nearby landmark (optional)"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E8E3] text-sm"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#5C6661] mb-1">
                  Delivery Note (optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any delivery instructions (optional)"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E8E3] text-sm"
                />
              </div>
            </div>

            {/* 3. Billing & Payment Options */}
            <div className="bg-white rounded-2xl p-6 space-y-4 border border-[#E5E8E3]">
              <h2 className="text-base sm:text-lg font-bold text-[#121614]">
                3. Payment Option
              </h2>

              <div className="space-y-3">
                {/* Option A: UPI Prepaid */}
                <div
                  className={`rounded-xl border transition-all ${
                    paymentMethod === "upi"
                      ? "border-[#184D3B] bg-[#F4F8F6] ring-1 ring-[#184D3B]"
                      : "border-[#E5E8E3] bg-white"
                  }`}
                >
                  <label className="flex items-start gap-3 p-4 cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === "upi"}
                      onChange={() => setPaymentMethod("upi")}
                      className="mt-1 accent-[#184D3B]"
                    />
                    <QrCode className="w-5 h-5 text-[#184D3B] shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-sm text-[#121614]">
                          UPI Prepaid (GPay / PhonePe / Paytm)
                        </p>
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-[#E8F3EE] text-[#184D3B]">
                          Pay ₹{effectiveTotal}
                        </span>
                      </div>
                      <p className="text-xs text-[#5C6661] mt-0.5">
                        Scan the official QR code with any UPI app. Transaction reference is optional.
                      </p>
                    </div>
                  </label>

                  {paymentMethod === "upi" && (
                    <div className="px-4 pb-5 pt-2 border-t border-[#E5E8E3] space-y-4">
                      {/* Safety Assurance Banner */}
                      <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-[11px] text-emerald-950 flex items-start gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-[#154734] shrink-0 mt-0.5" />
                        <div className="space-y-0.5 text-xs">
                          <p className="font-bold text-[#154734]">100% Secure Direct UPI Payment</p>
                          <p className="text-[#5C6661] text-[11px] leading-relaxed">
                            Pay directly to official merchant ID <strong className="text-[#141A16] font-mono">{BRAND.upi.id}</strong>. EVOKA never asks for your UPI PIN or banking passwords.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center bg-white rounded-xl p-4 border border-[#E5E8E3]">
                        <div className="flex flex-col items-center justify-center">
                          <div className="p-2 bg-white rounded-xl border border-[#E5E8E3] shadow-sm">
                            <img
                              src={BRAND.upi.qrImage || "/images/evoka-upi-qr.jpg"}
                              alt="EVOKA Official UPI Scanner QR"
                              className="w-48 h-auto max-h-56 object-contain rounded-lg"
                            />
                          </div>
                          <span className="text-[11px] font-bold text-[#154734] mt-2 text-center">
                            Scan &amp; Pay Exact: <strong className="text-sm font-extrabold text-[#141A16]">₹{effectiveTotal}</strong>
                          </span>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <p className="text-[10px] uppercase tracking-wider font-extrabold text-[#5C6661]">
                              Official Merchant UPI ID
                            </p>
                            <div className="mt-1 flex items-center gap-2">
                              <code className="flex-1 px-3 py-2.5 rounded-xl bg-[#F4F6F4] border border-[#E5E8E3] text-xs font-mono font-bold text-[#121614] select-all truncate">
                                {BRAND.upi.id}
                              </code>
                              <button
                                type="button"
                                onClick={handleCopyUpi}
                                className="px-3 py-2.5 rounded-xl border border-[#E5E8E3] bg-white hover:bg-[#F4F6F4] text-xs font-bold text-[#121614] inline-flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
                              >
                                {copiedUpi ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-[#184D3B]" />
                                    <span>Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>
                            </div>
                          </div>

                          <div className="rounded-xl bg-[#F9FAF8] border border-[#E5E8E3] p-3 flex items-center justify-between">
                            <div>
                              <p className="text-[11px] text-[#5C6661] font-semibold">Total Payable Amount</p>
                              <p className="text-xl font-extrabold text-[#184D3B]">₹{effectiveTotal}</p>
                            </div>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold uppercase">
                              Zero Surcharge
                            </span>
                          </div>

                          {/* 1-Click Pay for Mobile Devices */}
                          <a
                            href={`upi://pay?pa=${encodeURIComponent(BRAND.upi.id)}&pn=${encodeURIComponent(BRAND.upi.payeeName)}&am=${effectiveTotal}&cu=INR&tn=${encodeURIComponent("EVOKA Order Payment")}`}
                            className="w-full py-2.5 px-3 rounded-xl bg-[#154734] text-white text-xs font-bold hover:bg-[#1E6B4B] transition-colors flex items-center justify-center gap-2 text-center shadow-sm"
                          >
                            <QrCode className="w-4 h-4 text-[#E5A91A]" />
                            <span>Pay via GPay / PhonePe / Paytm App</span>
                          </a>

                          <p className="text-[10px] text-[#5C6661] leading-relaxed">
                            Order is initially placed as <strong>PAYMENT_UNDER_REVIEW</strong> and confirmed upon actual receipt of bank funds.
                          </p>
                        </div>
                      </div>

                      {/* UPI Reference & Optional Screenshot */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-[#121614] mb-1">
                            UPI Transaction Reference / UTR <span className="text-[#5C6661] font-normal">(optional)</span>
                          </label>
                          <input
                            type="text"
                            value={upiReference}
                            onChange={(e) => setUpiReference(e.target.value)}
                            placeholder="12-digit UTR number (optional)"
                            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E5E8E3] text-sm font-mono focus:outline-none focus:border-[#184D3B]"
                          />
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-bold text-[#121614]">
                              Payment Screenshot <span className="text-red-600 font-bold">* (Mandatory)</span>
                            </label>
                            {paymentScreenshot && (
                              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                ✓ Attached
                              </span>
                            )}
                          </div>
                          {paymentScreenshot ? (
                            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border-2 border-emerald-500/50 shadow-sm">
                              <img
                                src={paymentScreenshot}
                                alt="Uploaded payment proof"
                                className="w-11 h-11 rounded-lg object-cover border border-[#E5E8E3]"
                              />
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-semibold text-[#184D3B] block truncate">
                                  Screenshot verified & attached
                                </span>
                                <span className="text-[10px] text-[#5C6661] block">
                                  Tap place order to finish
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => setPaymentScreenshot("")}
                                className="p-1.5 text-[#5C6661] hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                                title="Remove and replace screenshot"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <label className="flex flex-col items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-amber-50/50 border-2 border-dashed border-amber-300 hover:border-[#184D3B] text-xs font-semibold text-[#184D3B] cursor-pointer transition-all text-center group">
                              <div className="flex items-center gap-1.5">
                                <Upload className="w-4 h-4 text-[#184D3B] group-hover:scale-110 transition-transform" />
                                <span>{uploadingProof ? "Uploading..." : "Upload Payment Screenshot"}</span>
                              </div>
                              <span className="text-[10px] text-amber-800 font-medium">
                                Mandatory: Upload photo/screenshot of successful UPI payment
                              </span>
                              <input
                                type="file"
                                accept="image/png,image/jpeg,image/webp"
                                onChange={handleProofUpload}
                                disabled={uploadingProof}
                                className="hidden"
                              />
                            </label>
                          )}
                          {proofError && (
                            <p className="text-[11px] text-red-600 font-semibold mt-1.5 flex items-center gap-1">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>{proofError}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Option B: Cash on Delivery */}
                <label
                  className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                    paymentMethod === "cod"
                      ? "border-[#184D3B] bg-[#F4F8F6] ring-1 ring-[#184D3B]"
                      : "border-[#E5E8E3] bg-white"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                    className="mt-1 accent-[#184D3B]"
                  />
                  <Banknote className="w-5 h-5 text-[#184D3B] shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-sm text-[#121614]">
                      Cash on Delivery (COD)
                    </p>
                    <p className="text-xs text-[#5C6661]">
                      Pay upon doorstep delivery or outlet pickup. Order opens in WhatsApp for confirmation.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary */}
          <aside className="lg:col-span-5 bg-white rounded-2xl p-6 border border-[#E5E8E3] sticky top-24 space-y-5 shadow-xs">
            <h2 className="text-lg font-bold text-[#121614]">Order Summary</h2>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={`${item.productId}-${item.variantId}`} className="flex gap-3 items-center">
                  <SafeImage
                    src={item.image}
                    alt={item.name}
                    className="w-14 h-14 rounded-xl object-contain p-1.5 bg-[#F6F7F4] shrink-0 border border-[#E5E8E3]"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-[#121614] truncate">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-[#5C6661]">
                      {item.variantLabel} × {item.quantity}
                    </p>
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-[#121614]">
                    ₹{item.price * item.quantity}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-[#E5E8E3] pt-4 space-y-2 text-xs sm:text-sm text-[#5C6661]">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-[#121614]">₹{subtotal}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-[#184D3B] font-bold">
                  <span>Discount ({couponCode})</span>
                  <span>-₹{discount}</span>
                </div>
              )}
              <div className="flex justify-between text-[#184D3B] font-bold">
                <span>{fulfillmentType === "pickup" ? "Outlet Pickup" : "Doorstep Delivery"}</span>
                <span>FREE</span>
              </div>
              <div className="flex justify-between text-base sm:text-lg font-bold text-[#121614] pt-2 border-t border-[#E5E8E3]">
                <span>Total Payable</span>
                <span>₹{effectiveTotal}</span>
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || uploadingProof}
              className="w-full py-3.5 rounded-xl bg-[#184D3B] hover:bg-[#12382B] text-white font-bold text-sm inline-flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <Lock className="w-4 h-4" />
              <span>
                {submitting
                  ? "Placing Order..."
                  : paymentMethod === "upi"
                  ? `Place UPI Order (₹${effectiveTotal})`
                  : `Place COD Order (₹${effectiveTotal})`}
              </span>
            </button>
            <p className="text-[11px] text-center text-[#5C6661]">
              Server-verified pricing • Opens WhatsApp with your pre-filled order summary
            </p>
          </aside>
        </form>
      </div>
    </div>
  );
}
