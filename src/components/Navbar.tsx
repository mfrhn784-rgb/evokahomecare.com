"use client";

import React, { useState, useRef, useEffect } from "react";
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

const SEARCH_SUGGESTIONS = [
  { label: "Matic Liquid Detergent", query: "Matic" },
  { label: "Dish Wash Liquid", query: "Dish Wash" },
  { label: "Floor Cleaner 5L", query: "Floor Cleaner" },
  { label: "Toilet & Tile Cleaner", query: "Toilet" },
  { label: "Liquid Hand Wash", query: "Hand Wash" },
  { label: "Kerala Bath Soaps", query: "Soap" },
];

export function Navbar() {
  const { totalItems, openCart } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const submitSearch = (term: string) => {
    const q = term.trim();
    router.push(q ? `/shop?q=${encodeURIComponent(q)}` : "/shop");
    setShowSuggestions(false);
    setMobileOpen(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    submitSearch(searchTerm);
  };

  const filteredSuggestions = searchTerm.trim()
    ? SEARCH_SUGGESTIONS.filter((s) =>
        s.label.toLowerCase().includes(searchTerm.trim().toLowerCase())
      )
    : SEARCH_SUGGESTIONS;

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E5E8E3]">
      {/* Announcement Bar */}
      <div className="bg-[#154734] text-white text-[11px] sm:text-xs py-2 px-4">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 font-medium truncate">
            <span className="px-2 py-0.5 rounded bg-[#E5A91A] text-[#141A16] text-[10px] font-bold uppercase tracking-wide shrink-0">
              Free Delivery
            </span>
            <span className="truncate text-white/90">
              No Minimum Order • Cash on Delivery Available
            </span>
          </div>

          <div className="hidden md:flex items-center gap-4 shrink-0 text-[11px]">
            <a
              href={BRAND.phoneHref}
              className="inline-flex items-center gap-1.5 text-white/90 hover:text-[#E5A91A] transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5 text-[#E5A91A]" />
              <span>{BRAND.phone}</span>
            </a>
            <span className="text-white/25">|</span>
            <Link
              href="/orders"
              className="inline-flex items-center gap-1.5 text-white/90 hover:text-white transition-colors"
            >
              <PackageCheck className="w-3.5 h-3.5 text-[#4ADE80]" />
              <span>Track Order</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="h-16 sm:h-[70px] flex items-center justify-between gap-3">
          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-lg text-[#141A16] hover:bg-[#F6F7F4] transition-colors cursor-pointer"
            aria-label="Toggle Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Brand Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <img
              src="/images/evoka-logo.png"
              alt="EVOKA"
              className="h-9 sm:h-10 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-0.5 text-[13px] font-semibold text-[#141A16]">
            <Link
              href="/shop"
              className="px-3 py-2 rounded-lg hover:bg-[#F6F7F4] hover:text-[#154734] transition-colors whitespace-nowrap"
            >
              All Products
            </Link>
            {BRAND.categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/shop?category=${cat.slug}`}
                className="px-3 py-2 rounded-lg hover:bg-[#F6F7F4] hover:text-[#154734] transition-colors whitespace-nowrap"
              >
                {cat.name}
              </Link>
            ))}
            <Link
              href="/bundles"
              className="ml-1.5 px-3 py-2 rounded-lg bg-[#EBF5EE] text-[#154734] border border-[#154734]/15 hover:bg-[#154734] hover:text-white font-bold transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#E5A91A]" />
              <span>Combos (-20%)</span>
            </Link>
          </nav>

          {/* Right Actions: Search + Cart */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div ref={searchBoxRef} className="hidden md:block relative">
              <form onSubmit={handleSearch} className="flex items-center relative">
                <Search className="w-4 h-4 text-[#6B756D] absolute left-3 pointer-events-none" />
                <input
                  type="search"
                  value={searchTerm}
                  onFocus={() => setShowSuggestions(true)}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSuggestions(true);
                  }}
                  placeholder="Search detergents, floor, soap..."
                  className="w-52 xl:w-64 pl-9 pr-3 py-2 text-xs rounded-lg bg-[#F6F7F4] border border-[#E5E8E3] focus:outline-none focus:border-[#154734] focus:bg-white transition-all"
                />
              </form>

              {showSuggestions && (
                <div className="absolute right-0 mt-1.5 w-72 rounded-xl border border-[#E5E8E3] bg-white shadow-lg p-2 z-50">
                  <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#6B756D]">
                    {searchTerm.trim() ? "Matching Suggestions" : "Popular Searches"}
                  </p>
                  <div className="mt-1 space-y-0.5">
                    {filteredSuggestions.map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => {
                          setSearchTerm(item.query);
                          submitSearch(item.query);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#141A16] hover:bg-[#F6F7F4] hover:text-[#154734] flex items-center justify-between cursor-pointer"
                      >
                        <span>{item.label}</span>
                        <Search className="w-3 h-3 text-[#6B756D]" />
                      </button>
                    ))}
                    {searchTerm.trim() && (
                      <button
                        type="button"
                        onClick={() => submitSearch(searchTerm)}
                        className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-bold text-[#154734] bg-[#EBF5EE] hover:bg-[#154734] hover:text-white transition-colors cursor-pointer"
                      >
                        Search for &ldquo;{searchTerm.trim()}&rdquo; &rarr;
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={openCart}
              className="relative px-3.5 py-2 rounded-lg bg-[#154734] text-white hover:bg-[#1E6B4B] transition-colors inline-flex items-center gap-2 text-xs font-bold cursor-pointer"
              aria-label="Open Cart"
            >
              <ShoppingBag className="w-4 h-4 text-[#E5A91A]" />
              <span className="hidden sm:inline">Cart</span>
              {totalItems > 0 && (
                <span className="px-1.5 py-0.5 rounded bg-[#E5A91A] text-[#141A16] text-[10px] font-extrabold leading-none">
                  {totalItems}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-[#E5E8E3] px-4 py-4 space-y-4 shadow-lg">
          <form onSubmit={handleSearch} className="relative">
            <Search className="w-4 h-4 text-[#6B756D] absolute left-3.5 top-3" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search detergents, dish wash, soaps..."
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg bg-[#F6F7F4] border border-[#E5E8E3] focus:outline-none focus:border-[#154734]"
            />
          </form>

          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            <Link
              href="/shop"
              onClick={() => setMobileOpen(false)}
              className="p-3 rounded-lg bg-[#F6F7F4] text-[#141A16]"
            >
              All Products
            </Link>
            <Link
              href="/bundles"
              onClick={() => setMobileOpen(false)}
              className="p-3 rounded-lg bg-[#EBF5EE] text-[#154734] border border-[#154734]/15 font-bold"
            >
              Combos (-20%)
            </Link>
            {BRAND.categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/shop?category=${cat.slug}`}
                onClick={() => setMobileOpen(false)}
                className="p-3 rounded-lg bg-[#F6F7F4] text-[#141A16] truncate"
              >
                {cat.name}
              </Link>
            ))}
            <Link
              href="/orders"
              onClick={() => setMobileOpen(false)}
              className="p-3 rounded-lg bg-[#F6F7F4] text-[#141A16] col-span-2 flex items-center justify-between"
            >
              <span>Track Order</span>
              <PackageCheck className="w-4 h-4 text-[#154734]" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
