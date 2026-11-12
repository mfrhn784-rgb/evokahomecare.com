"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  Search,
  ShoppingBag,
  X,
  PackageCheck,
  Sparkles,
  PhoneCall,
} from "lucide-react";
import { BRAND } from "@/lib/brand";
import { useCart } from "@/context/CartContext";

export function Navbar() {
  const { totalItems, openCart } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = searchTerm.trim();
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
    setMobileOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-sand">
      {/* Top Announcement Bar (Beco-style) */}
      <div className="bg-emerald-deep text-white text-[11px] sm:text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-semibold truncate">
            <span className="px-2 py-0.5 rounded bg-[#E5A91A] text-[#1A1D1B] text-[10px] font-extrabold uppercase tracking-wide shrink-0">
              Free Delivery
            </span>
            <span className="truncate text-white/90">
              No Minimum Order • Cash on Delivery Available Across Kerala
            </span>
          </div>

          <div className="hidden md:flex items-center gap-4 shrink-0 text-[11px]">
            <a
              href={BRAND.phoneHref}
              className="inline-flex items-center gap-1.5 text-white/85 hover:text-[#E5A91A] transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-[#E5A91A]" />
              <span>{BRAND.phone}</span>
            </a>
            <span className="text-white/25">|</span>
            <Link
              href="/orders"
              className="inline-flex items-center gap-1.5 text-white/85 hover:text-white transition-colors"
            >
              <PackageCheck className="w-3.5 h-3.5 text-[#4ADE80]" />
              <span>Track Order</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="h-16 sm:h-[72px] flex items-center justify-between gap-3">
          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-xl text-charcoal-deep hover:bg-[#F6F7F4] transition-colors cursor-pointer"
            aria-label="Toggle Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Clean Transparent Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <img
              src="/images/evoka-logo.png"
              alt="EVOKA"
              className="h-10 sm:h-11 w-auto object-contain"
            />
          </Link>

          {/* Desktop Category Links */}
          <nav className="hidden lg:flex items-center gap-1 text-[13px] font-bold text-charcoal-deep">
            <Link
              href="/shop"
              className="px-3 py-2 rounded-lg hover:bg-[#F6F7F4] hover:text-emerald-deep transition-colors"
            >
              Shop All
            </Link>
            <Link
              href="/shop?category=laundry-detergents"
              className="px-3 py-2 rounded-lg hover:bg-[#F6F7F4] hover:text-emerald-deep transition-colors"
            >
              Laundry
            </Link>
            <Link
              href="/shop?category=dish-wash"
              className="px-3 py-2 rounded-lg hover:bg-[#F6F7F4] hover:text-emerald-deep transition-colors"
            >
              Dish Wash
            </Link>
            <Link
              href="/shop?category=hand-wash"
              className="px-3 py-2 rounded-lg hover:bg-[#F6F7F4] hover:text-emerald-deep transition-colors"
            >
              Hand Wash
            </Link>
            <Link
              href="/shop?category=floor-cleaners"
              className="px-3 py-2 rounded-lg hover:bg-[#F6F7F4] hover:text-emerald-deep transition-colors"
            >
              Floor Cleaners
            </Link>
            <Link
              href="/shop?category=personal-care"
              className="px-3 py-2 rounded-lg hover:bg-[#F6F7F4] hover:text-emerald-deep transition-colors"
            >
              Personal Care
            </Link>
            <Link
              href="/bundles"
              className="ml-1 px-3.5 py-2 rounded-lg bg-[#EBF5EE] text-emerald-deep border border-emerald-deep/15 hover:bg-emerald-deep hover:text-white font-bold transition-colors inline-flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E5A91A]" />
              <span>Build a Box (-20%)</span>
            </Link>
          </nav>

          {/* Right Actions: Search + Admin + Cart */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            <form onSubmit={handleSearch} className="hidden md:flex items-center relative">
              <Search className="w-4 h-4 text-slate-body/60 absolute left-3 pointer-events-none" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products..."
                className="w-44 lg:w-52 pl-9 pr-3 py-2 text-xs rounded-xl bg-[#F6F7F4] border border-sand focus:outline-none focus:border-emerald-deep focus:bg-white transition-all"
              />
            </form>

            <Link
              href="/admin"
              className="hidden sm:inline-flex items-center px-3 py-2 rounded-xl border border-sand text-xs font-bold text-charcoal-deep hover:bg-[#F6F7F4] transition-colors"
            >
              Admin
            </Link>

            <button
              type="button"
              onClick={openCart}
              className="relative px-3.5 py-2 rounded-xl bg-emerald-deep text-white hover:bg-emerald-card transition-colors inline-flex items-center gap-2 text-xs font-bold cursor-pointer"
              aria-label="Open Cart"
            >
              <ShoppingBag className="w-4 h-4 text-[#E5A91A]" />
              <span className="hidden sm:inline">Cart</span>
              {totalItems > 0 && (
                <span className="px-1.5 py-0.5 rounded-md bg-[#E5A91A] text-[#1A1D1B] text-[10px] font-extrabold leading-none">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-sand px-4 py-5 space-y-4 shadow-lg">
          <form onSubmit={handleSearch} className="relative">
            <Search className="w-4 h-4 text-slate-body/60 absolute left-3.5 top-3" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search detergents, dish wash, soaps..."
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-[#F6F7F4] border border-sand focus:outline-none focus:border-emerald-deep"
            />
          </form>

          <div className="grid grid-cols-2 gap-2 text-xs font-bold">
            <Link
              href="/shop"
              onClick={() => setMobileOpen(false)}
              className="p-3 rounded-xl bg-[#F6F7F4] text-charcoal-deep"
            >
              Shop All
            </Link>
            <Link
              href="/bundles"
              onClick={() => setMobileOpen(false)}
              className="p-3 rounded-xl bg-[#EBF5EE] text-emerald-deep border border-emerald-deep/15"
            >
              Build a Box (-20%)
            </Link>
            {BRAND.categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/shop?category=${cat.slug}`}
                onClick={() => setMobileOpen(false)}
                className="p-3 rounded-xl bg-[#F6F7F4] text-charcoal-deep truncate"
              >
                {cat.name}
              </Link>
            ))}
            <Link
              href="/orders"
              onClick={() => setMobileOpen(false)}
              className="p-3 rounded-xl bg-[#F6F7F4] text-charcoal-deep"
            >
              Track Order
            </Link>
            <Link
              href="/admin"
              onClick={() => setMobileOpen(false)}
              className="p-3 rounded-xl bg-[#F6F7F4] text-charcoal-deep"
            >
              Owner Admin
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
