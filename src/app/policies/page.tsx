import React from "react";
import { BRAND } from "@/lib/brand";

export default function PoliciesPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
      <div>
        <span className="text-xs uppercase tracking-[0.18em] text-sage font-semibold">
          EVOKA Store Policies
        </span>
        <h1 className="font-serif-brand text-3xl sm:text-4xl font-semibold text-charcoal mt-1">
          Shipping, Returns &amp; Privacy
        </h1>
      </div>

      <section className="bg-white rounded-2xl border border-sand p-6 space-y-2">
        <h2 className="font-semibold text-lg text-charcoal">Free Delivery &amp; Store Pickup</h2>
        <p className="text-sm text-muted leading-relaxed">
          • <strong>100% Free Home Delivery</strong> across all orders—no minimum order value
          required.
          <br />• <strong>Cash on Delivery (COD):</strong> Pay via cash or UPI at your doorstep on
          delivery.
          <br />• <strong>Trivandrum Outlet Pickup:</strong> Pick up your order directly from our{" "}
          <strong>Poovar Uchakkada</strong> or <strong>Pallichal Junction</strong> outlets.
          <br />• Standard dispatch within 24–48 business hours.
        </p>
      </section>

      <section className="bg-white rounded-2xl border border-sand p-6 space-y-2">
        <h2 className="font-semibold text-lg text-charcoal">
          Order Cancellation, Changes &amp; Returns
        </h2>
        <p className="text-sm text-muted leading-relaxed">
          • You have full control to <strong>edit your delivery address or cancel your order</strong>{" "}
          anytime before it is packed directly from our{" "}
          <a href="/orders" className="text-sage underline font-medium">
            Track / Manage Order
          </a>{" "}
          page.
          <br />• If any bottle arrives leaking, damaged, or incorrect, share a photo with your Order
          ID on WhatsApp at <strong>{BRAND.phone}</strong> or email{" "}
          <strong>{BRAND.email}</strong> within 48 hours of delivery for a free replacement or full
          refund.
        </p>
      </section>

      <section id="privacy" className="bg-white rounded-2xl border border-sand p-6 space-y-2">
        <h2 className="font-semibold text-lg text-charcoal">Privacy &amp; Terms</h2>
        <p className="text-sm text-muted leading-relaxed">
          EVOKA Home &amp; Personal Care (Pallichal, Trivandrum, Kerala) collects only the name,
          phone number, email, and delivery address required to fulfill your orders and share status
          updates. For support, write to <strong>{BRAND.email}</strong> or call{" "}
          <strong>{BRAND.phone}</strong>.
        </p>
      </section>
    </div>
  );
}
