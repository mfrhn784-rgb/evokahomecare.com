"use client";

import React, { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { BRAND } from "@/lib/brand";

const FAQS = [
  {
    q: "Does EVOKA provide free home delivery across Trivandrum?",
    a: "Yes! EVOKA provides 100% free home delivery across Thiruvananthapuram on all online orders. There is no minimum order value required for free delivery.",
  },
  {
    q: "Can I pay using Cash on Delivery (COD) or UPI on delivery?",
    a: "Yes, you can pay using Cash on Delivery (COD) or scan any UPI QR code (Google Pay, PhonePe, Paytm, BHIM) at your doorstep when your order arrives.",
  },
  {
    q: "Where can I buy EVOKA products directly in Trivandrum?",
    a: "You can purchase directly from our physical outlets at Pallichal Junction and Poovar Uchakkada in Trivandrum, or order online right here for door delivery.",
  },
  {
    q: "Are bulk 5-Litre cans available for businesses, offices, and institutions?",
    a: "Yes! We formulate and supply 5L economy cans for Matic liquid detergent, perfumed floor cleaners, dishwash liquid, car shampoo, and hand wash. You can order online or contact our wholesale hotline at +91 9143374741.",
  },
  {
    q: "How can I track or modify my order?",
    a: "Visit our 'Track Order' page from the menu, enter your Order ID and phone number to see real-time updates, download GST invoices, or update your delivery instructions.",
  },
];

export function HomeFaq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": FAQS.map((faq) => ({
      "@type": "Question",
      "name": faq.q,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.a,
      },
    })),
  };

  return (
    <section className="border-t border-[#E5E8E3] bg-[#FAFAF8] py-14 sm:py-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#E8F4EE] px-3.5 py-1 text-xs font-bold text-[#154734]">
            <HelpCircle className="h-3.5 w-3.5" />
            Frequently Asked Questions
          </span>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[#141A16] sm:text-3xl">
            Everything You Need to Know About EVOKA
          </h2>
          <p className="mt-2 text-sm text-[#6B756D]">
            Ordering, free doorstep delivery in Trivandrum, bulk supply, and retail depots.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={faq.q}
                className="overflow-hidden rounded-2xl border border-[#E5E8E3] bg-white transition"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between gap-4 p-5 text-left text-sm sm:text-base font-bold text-[#141A16] hover:text-[#154734]"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 shrink-0 text-[#6B756D] transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-[#154734]" : ""
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="border-t border-[#E5E8E3]/60 bg-[#F6F7F4]/50 px-5 py-4 text-xs sm:text-sm leading-relaxed text-[#556358]">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
