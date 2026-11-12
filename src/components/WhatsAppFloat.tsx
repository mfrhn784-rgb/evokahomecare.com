import React from "react";
import { MessageCircle } from "lucide-react";
import { BRAND } from "@/lib/brand";

export function WhatsAppFloat() {
  return (
    <a
      href={`${BRAND.whatsappUrl}?text=${encodeURIComponent(
        "Hello EVOKA! I would like help choosing products from your catalog."
      )}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with EVOKA on WhatsApp"
      className="fixed bottom-6 right-6 z-30 inline-flex items-center gap-2.5 px-4 sm:px-5 py-3.5 rounded-full bg-emerald-deep text-pearl shadow-2xl hover:bg-emerald-vibrant hover:scale-105 transition-all text-xs sm:text-sm font-bold border border-white/20 backdrop-blur-md active:scale-95 group"
    >
      <span className="relative flex h-3 w-3">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-mint opacity-75" />
        <span className="relative inline-flex rounded-full h-3 w-3 bg-mint-glow" />
      </span>
      <MessageCircle className="w-4 h-4 text-mint-glow group-hover:rotate-12 transition-transform" />
      <span className="tracking-wide">Chat with EVOKA</span>
    </a>
  );
}
