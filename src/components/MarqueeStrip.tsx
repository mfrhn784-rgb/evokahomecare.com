import React from "react";
import { Truck, ShieldCheck, Package, MapPin, Banknote } from "lucide-react";

export function MarqueeStrip() {
  const items = [
    { icon: Truck, text: "Free Home Delivery — No Minimum Order" },
    { icon: Banknote, text: "Cash on Delivery Available" },
    { icon: Package, text: "400ml, 500ml, 1L, 2L & 5L Pack Sizes" },
    { icon: MapPin, text: "Pallichal Jn & Poovar Uchakkada, Trivandrum" },
    { icon: ShieldCheck, text: "Order Directly on WhatsApp: +91 96333 43432" },
  ];

  return (
    <div className="relative overflow-hidden py-2.5 bg-emerald-deep text-white border-y border-emerald-card select-none">
      <div className="flex w-max animate-marquee space-x-10 text-xs font-semibold tracking-wide">
        {[...items, ...items, ...items].map((item, idx) => (
          <div key={idx} className="flex items-center space-x-2 opacity-95">
            <item.icon className="w-3.5 h-3.5 text-[#E5A91A]" />
            <span>{item.text}</span>
            <span className="text-[#E5A91A]/70 pl-4">•</span>
          </div>
        ))}
      </div>
    </div>
  );
}
