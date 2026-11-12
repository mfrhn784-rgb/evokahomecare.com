"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Search,
  PackageCheck,
  Printer,
  Edit3,
  XCircle,
  Truck,
  CheckCircle2,
  MessageCircle,
  RotateCcw,
  Clock,
} from "lucide-react";
import { Order } from "@/lib/types";
import { BRAND } from "@/lib/brand";
import { useCart } from "@/context/CartContext";
import {
  loadSavedOrders,
  loadSavedProfile,
  SavedOrderRef,
  syncSavedOrdersStatus,
} from "@/lib/customer-storage";

const TIMELINE = ["Pending", "Confirmed", "Packed", "Shipped", "Delivered"] as const;

function OrdersContent() {
  const { addItem, openCart } = useCart();
  const searchParams = useSearchParams();
  const initialId = searchParams.get("id") || "";
  const initialPhone = searchParams.get("phone") || "";

  const [orderIdInput, setOrderIdInput] = useState(initialId);
  const [phoneInput, setPhoneInput] = useState(initialPhone);
  const [orders, setOrders] = useState<Order[]>([]);
  const [savedOrders, setSavedOrders] = useState<SavedOrderRef[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [actionMsg, setActionMsg] = useState("");
  const [searched, setSearched] = useState(false);

  // Edit address state
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editLine1, setEditLine1] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editPincode, setEditPincode] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const fetchOrders = async (idVal: string, phoneVal: string) => {
    const cleanPhone = phoneVal.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      setError("Please enter the 10-digit mobile number used during checkout.");
      return;
    }
    setLoading(true);
    setError("");
    setActionMsg("");
    setSearched(true);
    try {
      const qs = new URLSearchParams();
      if (idVal.trim()) qs.set("id", idVal.trim());
      qs.set("phone", cleanPhone);
      const res = await fetch(`/api/orders?${qs.toString()}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not find orders.");
        setOrders([]);
      } else if (data.order) {
        setOrders([data.order]);
        syncSavedOrdersStatus([data.order]);
        setSavedOrders(loadSavedOrders());
      } else {
        const list = (data.orders || []) as Order[];
        setOrders(list);
        if (list.length > 0) {
          syncSavedOrdersStatus(list);
          setSavedOrders(loadSavedOrders());
        }
      }
    } catch {
      setError("Network error while checking orders.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const localOrders = loadSavedOrders();
    setSavedOrders(localOrders);
    if (initialPhone) {
      fetchOrders(initialId, initialPhone);
      return;
    }
    const savedProfile = loadSavedProfile();
    const autoPhone = savedProfile?.phone || localOrders[0]?.phone || "";
    if (autoPhone && autoPhone.replace(/\D/g, "").length >= 10) {
      setPhoneInput(autoPhone);
      fetchOrders("", autoPhone);
    }
  }, [initialId, initialPhone]);

  const handleReorder = (order: Order) => {
    for (const item of order.items) {
      addItem({ ...item });
    }
    openCart();
  };

  const handleCancelOrder = async (order: Order) => {
    const reason = window.prompt("Optional reason for cancelling this order:", "Changed my mind");
    if (reason === null) return;

    const res = await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerAction: "cancel",
        orderId: order.id,
        phone: phoneInput || order.phone,
        reason,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not cancel order.");
      return;
    }
    setOrders((prev) => prev.map((o) => (o.id === order.id ? data.order : o)));
    setActionMsg(`Order ${order.id} has been cancelled.`);
  };

  const startEditing = (order: Order) => {
    setEditingOrderId(order.id);
    setEditLine1(order.address.line1);
    setEditCity(order.address.city);
    setEditPincode(order.address.pincode);
    setEditNotes(order.notes || "");
  };

  const saveAddressEdit = async (order: Order) => {
    const res = await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerAction: "update_address",
        orderId: order.id,
        phone: phoneInput || order.phone,
        address: {
          ...order.address,
          line1: editLine1,
          city: editCity,
          pincode: editPincode,
        },
        notes: editNotes,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error || "Could not update address.");
      return;
    }
    setOrders((prev) => prev.map((o) => (o.id === order.id ? data.order : o)));
    setEditingOrderId(null);
    setActionMsg(`Delivery details updated for ${order.id}.`);
  };

  return (
    <div className="mesh-bg min-h-screen py-12">
      <div className="max-w-4xl mx-auto px-4 space-y-8">
        <div className="text-center space-y-2 print:hidden">
          <div className="w-12 h-12 rounded-full bg-mint-light text-emerald-vibrant flex items-center justify-center mx-auto mb-2">
            <PackageCheck className="w-6 h-6" />
          </div>
          <h1 className="font-editorial text-3xl sm:text-4xl font-bold text-emerald-deep">
            Track &amp; Manage Your Orders
          </h1>
          <p className="text-xs sm:text-sm text-slate-body font-medium">
            Your recent orders on this device load automatically. Verify any mobile number to view
            invoices, reorder, or manage delivery.
          </p>
        </div>

        {/* Saved Recent Orders Quick Strip */}
        {savedOrders.length > 0 && (
          <div className="bg-white rounded-2xl border border-[#E5E8E3] p-4 space-y-2.5 print:hidden">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-[#121614] inline-flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[#184D3B]" />
                Recent Orders on This Device
              </span>
              <button
                type="button"
                onClick={() => {
                  const p = savedOrders[0]?.phone || phoneInput;
                  if (p) {
                    setOrderIdInput("");
                    setPhoneInput(p);
                    fetchOrders("", p);
                  }
                }}
                className="text-[11px] font-bold text-[#184D3B] hover:underline cursor-pointer"
              >
                Show All ({savedOrders.length})
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {savedOrders.slice(0, 6).map((ref) => (
                <button
                  key={ref.id}
                  type="button"
                  onClick={() => {
                    setOrderIdInput(ref.id);
                    setPhoneInput(ref.phone);
                    fetchOrders(ref.id, ref.phone);
                  }}
                  className={`px-3 py-1.5 rounded-xl border text-left text-xs transition-all cursor-pointer ${
                    orders.some((o) => o.id === ref.id)
                      ? "bg-[#EBF5EE] border-[#184D3B] text-[#184D3B]"
                      : "bg-[#F9FAF8] border-[#E5E8E3] text-[#121614] hover:border-[#184D3B]"
                  }`}
                >
                  <span className="font-mono font-bold">{ref.id}</span>
                  <span className="mx-1.5 text-[#5C6661]">•</span>
                  <span className="font-semibold">₹{ref.total}</span>
                  <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-white border border-[#E5E8E3]">
                    {ref.status}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchOrders(orderIdInput, phoneInput);
          }}
          className="glass-panel rounded-3xl border border-emerald-deep/10 p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-12 gap-3.5 print:hidden shadow-xs"
        >
          <div className="sm:col-span-5">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-body mb-1">
              Mobile Number *
            </label>
            <input
              required
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="10-digit mobile number"
              className="w-full px-4 py-2.5 rounded-2xl bg-white border border-emerald-deep/15 text-xs sm:text-sm focus:outline-none focus:border-emerald-vibrant"
            />
          </div>
          <div className="sm:col-span-4">
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-body mb-1">
              Order ID (optional)
            </label>
            <input
              type="text"
              value={orderIdInput}
              onChange={(e) => setOrderIdInput(e.target.value)}
              placeholder="EVK-123456"
              className="w-full px-4 py-2.5 rounded-2xl bg-white border border-emerald-deep/15 text-xs sm:text-sm focus:outline-none focus:border-emerald-vibrant"
            />
          </div>
          <div className="sm:col-span-3 flex items-end">
            <button
              type="submit"
              className="w-full py-3 px-5 rounded-full bg-emerald-deep text-pearl text-xs sm:text-sm font-bold hover:bg-emerald-vibrant transition-all inline-flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95"
            >
              <Search className="w-4 h-4" />
              <span>Find Order</span>
            </button>
          </div>
        </form>

        {error && (
          <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-xs sm:text-sm font-bold border border-red-200">
            {error}
          </div>
        )}
        {actionMsg && (
          <div className="p-4 rounded-2xl bg-mint-light text-emerald-deep text-xs sm:text-sm font-bold border border-mint/30">
            {actionMsg}
          </div>
        )}
        {loading && <p className="text-center text-xs text-slate-body font-semibold">Loading orders...</p>}

        {!loading && searched && !error && orders.length === 0 && (
          <div className="glass-panel rounded-3xl border border-emerald-deep/10 p-10 text-center">
            <p className="font-editorial text-xl font-bold text-emerald-deep">
              No orders found for this mobile number
            </p>
            <p className="text-xs text-slate-body mt-1">
              Need assistance? WhatsApp or call EVOKA at {BRAND.phone} or email {BRAND.email}.
            </p>
          </div>
        )}

        <div className="space-y-6">
          {orders.map((order) => {
            const canModify =
              order.status === "PENDING_CONFIRMATION" ||
              order.status === "Pending" ||
              order.status === "Confirmed";
            const normalizedStatus =
              order.status === "PENDING_CONFIRMATION" ? "Pending" : order.status;
            const currentStep = TIMELINE.indexOf(normalizedStatus as (typeof TIMELINE)[number]);

            return (
              <div
                key={order.id}
                className="glass-panel rounded-[32px] border border-emerald-deep/10 p-6 sm:p-8 space-y-6 shadow-sm"
              >
                {/* Print Header */}
                <div className="hidden print:flex justify-between items-start border-b border-emerald-deep/15 pb-4">
                  <div>
                    <h2 className="text-xl font-bold text-emerald-deep">
                      EVOKA — Botanical Home &amp; Personal Care
                    </h2>
                    <p className="text-xs text-slate-body">
                      {BRAND.origin} • {BRAND.phone} • {BRAND.email}
                    </p>
                  </div>
                  <div className="text-right text-xs">
                    <p className="font-bold">TAX INVOICE / RECEIPT</p>
                    <p>{order.id}</p>
                  </div>
                </div>

                {/* Order Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-emerald-deep/10">
                  <div>
                    <p className="text-[11px] text-slate-body font-semibold">
                      Placed on {new Date(order.createdAt).toLocaleString("en-IN")}
                    </p>
                    <h2 className="text-2xl font-black text-emerald-deep">{order.id}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full bg-ice text-xs font-bold text-emerald-deep border border-emerald-deep/10">
                      {order.paymentStatus}
                    </span>
                    <span
                      className={`px-3.5 py-1 rounded-full text-xs font-black ${
                        order.status === "Cancelled"
                          ? "bg-red-100 text-red-600"
                          : "bg-mint-light text-emerald-vibrant"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>

                {/* Visual Timeline Bar */}
                {order.status !== "Cancelled" ? (
                  <div className="grid grid-cols-5 gap-2 text-center pt-2">
                    {TIMELINE.map((step, idx) => {
                      const done = currentStep >= idx;
                      return (
                        <div key={step} className="space-y-1.5">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              done ? "bg-gradient-to-r from-mint to-emerald-vibrant" : "bg-ice"
                            }`}
                          />
                          <p
                            className={`text-[10px] font-bold uppercase tracking-wider ${
                              done ? "text-emerald-deep" : "text-slate-body/50"
                            }`}
                          >
                            {step}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-2xl bg-red-50 text-red-600 text-xs font-bold">
                    Order Cancelled{order.cancellationReason ? ` — ${order.cancellationReason}` : ""}
                  </div>
                )}

                {/* Tracking Info */}
                {(order.courierName || order.trackingNumber) && (
                  <div className="p-4 rounded-2xl bg-mint-light border border-mint/30 flex items-center gap-3 text-xs sm:text-sm">
                    <Truck className="w-5 h-5 text-emerald-vibrant shrink-0" />
                    <div>
                      <p className="font-bold text-emerald-deep">
                        Shipped via {order.courierName || "EVOKA Delivery"}
                      </p>
                      {order.trackingNumber && (
                        <p className="text-xs text-slate-body">Tracking ID: {order.trackingNumber}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Item List */}
                <div className="space-y-2.5 text-xs sm:text-sm">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-1 border-b border-emerald-deep/5">
                      <div>
                        <p className="font-bold text-emerald-deep">{item.name}</p>
                        <p className="text-[11px] text-slate-body font-medium">
                          {item.variantLabel} × {item.quantity}
                        </p>
                      </div>
                      <span className="font-black text-emerald-deep">
                        ₹{item.price * item.quantity}
                      </span>
                    </div>
                  ))}
                  <div className="pt-2 space-y-1 text-xs text-slate-body">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>₹{order.subtotal}</span>
                    </div>
                    {order.discount > 0 && (
                      <div className="flex justify-between text-emerald-vibrant font-bold">
                        <span>Discount {order.couponCode ? `(${order.couponCode})` : ""}</span>
                        <span>-₹{order.discount}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-emerald-vibrant font-bold">
                      <span>Delivery</span>
                      <span>FREE</span>
                    </div>
                    <div className="flex justify-between text-base font-black text-emerald-deep pt-2 border-t border-emerald-deep/10">
                      <span>Total Amount</span>
                      <span>₹{order.total}</span>
                    </div>
                  </div>
                </div>

                {/* Address & Edit Address */}
                {editingOrderId === order.id ? (
                  <div className="p-5 rounded-2xl bg-white border border-emerald-deep/15 space-y-3 print:hidden">
                    <p className="text-xs font-bold uppercase tracking-wider text-emerald-deep">
                      Update Shipping Address
                    </p>
                    <input
                      type="text"
                      value={editLine1}
                      onChange={(e) => setEditLine1(e.target.value)}
                      placeholder="Street address"
                      className="w-full px-3.5 py-2 rounded-xl bg-ice border border-emerald-deep/15 text-xs"
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={editCity}
                        onChange={(e) => setEditCity(e.target.value)}
                        placeholder="City"
                        className="px-3.5 py-2 rounded-xl bg-ice border border-emerald-deep/15 text-xs"
                      />
                      <input
                        type="text"
                        value={editPincode}
                        onChange={(e) => setEditPincode(e.target.value)}
                        placeholder="PIN Code"
                        className="px-3.5 py-2 rounded-xl bg-ice border border-emerald-deep/15 text-xs"
                      />
                    </div>
                    <input
                      type="text"
                      value={editNotes}
                      onChange={(e) => setEditNotes(e.target.value)}
                      placeholder="Delivery instructions"
                      className="w-full px-3.5 py-2 rounded-xl bg-ice border border-emerald-deep/15 text-xs"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => saveAddressEdit(order)}
                        className="px-4 py-2 rounded-full bg-emerald-deep text-pearl text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-mint-glow" /> Save Address
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingOrderId(null)}
                        className="px-4 py-2 rounded-full bg-ice text-slate-body text-xs font-bold cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-white/80 border border-emerald-deep/8 text-xs text-slate-body space-y-1">
                    <p className="font-bold text-emerald-deep">
                      {order.fulfillmentType === "pickup"
                        ? `Store Pickup: ${order.pickupOutlet}`
                        : `Deliver To: ${order.customerName} (${order.phone})`}
                    </p>
                    {order.fulfillmentType === "delivery" && (
                      <p>
                        {order.address.line1}, {order.address.city}, {order.address.state} -{" "}
                        {order.address.pincode}
                      </p>
                    )}
                    {order.notes && <p>Note: {order.notes}</p>}
                  </div>
                )}

                {/* Customer Action Controls */}
                <div className="flex flex-wrap gap-2.5 pt-2 print:hidden">
                  <button
                    type="button"
                    onClick={() => handleReorder(order)}
                    className="px-4 py-2 rounded-full bg-[#184D3B] text-white text-xs font-bold inline-flex items-center gap-1.5 hover:bg-[#12382B] transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Reorder Items
                  </button>

                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2 rounded-full bg-white border border-emerald-deep/15 text-emerald-deep text-xs font-bold inline-flex items-center gap-1.5 hover:bg-ice transition-colors cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5 text-emerald-vibrant" /> Print / Save Invoice
                  </button>

                  {canModify && order.fulfillmentType === "delivery" && (
                    <button
                      type="button"
                      onClick={() => startEditing(order)}
                      className="px-4 py-2 rounded-full bg-white border border-emerald-deep/15 text-emerald-deep text-xs font-bold inline-flex items-center gap-1.5 hover:border-mint transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-emerald-vibrant" /> Edit Address
                    </button>
                  )}

                  {canModify && (
                    <button
                      type="button"
                      onClick={() => handleCancelOrder(order)}
                      className="px-4 py-2 rounded-full bg-white border border-red-200 text-red-600 text-xs font-bold inline-flex items-center gap-1.5 hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Cancel Order
                    </button>
                  )}

                  <a
                    href={`${BRAND.whatsappUrl}?text=${encodeURIComponent(
                      `Hello EVOKA! Regarding my order ${order.id} (${order.customerName}):`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto px-4 py-2 rounded-full bg-mint-light text-emerald-vibrant text-xs font-bold inline-flex items-center gap-1.5 hover:bg-emerald-deep hover:text-white transition-all"
                  >
                    <MessageCircle className="w-3.5 h-3.5" /> Help on WhatsApp
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense fallback={<div className="p-16 text-center text-xs text-slate-body">Loading...</div>}>
      <OrdersContent />
    </Suspense>
  );
}
