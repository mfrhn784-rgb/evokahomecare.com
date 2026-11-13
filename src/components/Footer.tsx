import React from "react";
import Link from "next/link";
import { MapPin, Phone, MessageCircle, Instagram } from "lucide-react";
import { BRAND } from "@/lib/brand";

export function Footer() {
  return (
    <footer className="bg-emerald-deep text-white/85 border-t border-emerald-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Brand Column */}
        <div className="space-y-4">
          <div className="inline-flex items-center bg-white px-3 py-2 rounded-xl shadow-xs">
            <img src="/images/evoka-logo.png" alt="EVOKA" className="h-9 w-auto object-contain" />
          </div>

          <p className="text-xs sm:text-sm text-white/75 leading-relaxed">
            Home &amp; Personal Care — {BRAND.origin}.
          </p>

          <div className="flex items-center gap-2.5 pt-1">
            <a
              href={BRAND.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <Instagram className="w-3.5 h-3.5 text-[#E5A91A]" />
              <span>{BRAND.instagramHandle}</span>
            </a>
            <a
              href={BRAND.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs px-3.5 py-2 rounded-lg bg-[#25D366] hover:bg-[#1ebe57] text-white font-bold transition-colors"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>

        {/* Categories */}
        <div>
          <h3 className="font-bold text-white mb-4 text-xs uppercase tracking-wider">
            Categories
          </h3>
          <ul className="space-y-2 text-xs sm:text-sm text-white/75">
            {BRAND.categories.slice(0, 6).map((cat) => (
              <li key={cat.slug}>
                <Link
                  href={`/shop?category=${cat.slug}`}
                  className="hover:text-white transition-colors"
                >
                  {cat.name}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/bundles" className="text-[#E5A91A] font-semibold hover:underline">
                Build a Box (-20%)
              </Link>
            </li>
          </ul>
        </div>

        {/* Trivandrum Outlets */}
        <div>
          <h3 className="font-bold text-white mb-4 text-xs uppercase tracking-wider">
            Our Outlets
          </h3>
          <ul className="space-y-4 text-xs sm:text-sm text-white/75">
            {BRAND.outlets.map((outlet) => (
              <li key={outlet.id} className="space-y-1">
                <p className="font-bold text-white flex items-start gap-1.5">
                  <MapPin className="w-4 h-4 text-[#E5A91A] shrink-0 mt-0.5" />
                  <span>{outlet.name}</span>
                </p>
                <p className="text-xs text-white/65 pl-5">{outlet.address}</p>
                <a
                  href={outlet.mapQuery}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block pl-5 text-[11px] text-[#4ADE80] hover:underline"
                >
                  Open in Google Maps →
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Customer Care */}
        <div>
          <h3 className="font-bold text-white mb-4 text-xs uppercase tracking-wider">
            Customer Care
          </h3>
          <ul className="space-y-2.5 text-xs sm:text-sm text-white/75">
            <li>
              <a
                href={BRAND.phoneHref}
                className="inline-flex items-center gap-1.5 text-white font-semibold hover:underline"
              >
                <Phone className="w-3.5 h-3.5 text-[#E5A91A]" />
                <span>{BRAND.phone}</span>
              </a>
            </li>
            <li>
              <a href={BRAND.emailHref} className="hover:text-white transition-colors">
                {BRAND.email}
              </a>
            </li>
            <li className="pt-1">
              <Link href="/orders" className="hover:text-white transition-colors">
                Track / Manage My Order
              </Link>
            </li>
            <li>
              <Link href="/admin" className="text-white/55 hover:text-white text-xs">
                Store Owner Admin
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-6 px-4 max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-white/60">
        <div>
          © {new Date().getFullYear()} EVOKA Home &amp; Personal Care — Pallichal, Trivandrum, Kerala. All rights reserved.
        </div>

        {/* Unique Architect Signature Credit for Muhammed Farhan */}
        <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/[0.06] border border-white/15 backdrop-blur-sm shadow-inner text-white/80 hover:border-[#E5A91A]/60 transition-all group">
          <span className="text-[11px] font-medium tracking-wide text-white/70">
            Crafted &amp; Engineered by{" "}
            <span className="font-extrabold text-white tracking-wider group-hover:text-[#E5A91A] transition-colors">
              MUHAMMED FARHAN
            </span>
          </span>
          <span className="w-1 h-1 rounded-full bg-[#E5A91A]" />
          <a
            href="https://instagram.com/mhmmed.farhan"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-white/90 hover:text-[#E5A91A] transition-colors"
            title="Muhammed Farhan (@mhmmed.farhan) on Instagram"
          >
            <Instagram className="w-3.5 h-3.5 text-[#E5A91A] shrink-0" />
            <span className="underline decoration-white/30 underline-offset-2">mhmmed.farhan</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
