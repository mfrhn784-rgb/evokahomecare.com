"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  Home,
  Search,
  ShoppingBag,
  X,
  PackageCheck,
  Sparkles,
  PhoneCall,
  Clock,
  ChevronRight,
  UserCheck,
  MessageCircle,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { BRAND } from "@/lib/brand";
import { useCart } from "@/context/CartContext";
import {
  EVOKA_STORAGE_EVENT,
  loadSavedProfile,
  SavedCustomerProfile,
} from "@/lib/customer-storage";

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
  const [savedProfile, setSavedProfile] = useState<SavedCustomerProfile | null>(null);

  useEffect(() => {
    setSavedProfile(loadSavedProfile());
    const handleStorage = () => setSavedProfile(loadSavedProfile());
    window.addEventListener(EVOKA_STORAGE_EVENT, handleStorage);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(EVOKA_STORAGE_EVENT, handleStorage);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  // Prevent body scroll when sliding drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Close drawer on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setShowSuggestions(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (searchBoxRef.current && !searchBoxRef.current.contains(target)) {
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
              DIRECT FACTORY
            </span>
            <span className="truncate text-white/90">
              Commercial-Grade Home &amp; Personal Care • Doorstep Delivery &amp; Outlet Pickup
            </span>
          </div>

          <div className="hidden md:flex items-center gap-4 shrink-0 text-[11px]">
            {savedProfile?.customerName && (
              <span className="inline-flex items-center gap-1.5 text-white/90 font-medium">
                <UserCheck className="w-3.5 h-3.5 text-[#4ADE80]" />
                <span className="truncate max-w-[150px]">
                  Hi, {savedProfile.customerName.split(" ")[0]}
                </span>
                <span className="text-white/30">•</span>
                <span className="text-[10px] text-white/70">Details auto-saved</span>
              </span>
            )}
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
          {/* Mobile: Hamburger toggle + dedicated Home button */}
          <div className="flex items-center gap-1 lg:hidden">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-lg text-[#141A16] hover:bg-[#F6F7F4] transition-colors cursor-pointer"
              aria-label="Open Navigation Menu"
            >
              <Menu className="w-5 h-5 text-[#141A16]" />
            </button>
            <Link
              href="/"
              className="p-2 rounded-lg text-[#141A16] hover:bg-[#F6F7F4] hover:text-[#154734] transition-colors inline-flex items-center"
              title="Home"
              aria-label="Home"
            >
              <Home className="w-5 h-5 text-[#154734]" />
            </Link>
          </div>

          {/* Brand Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <img
              src="/images/evoka-logo.png"
              alt="EVOKA"
              className="h-9 sm:h-10 w-auto object-contain"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1 text-[13px] font-semibold text-[#141A16]">
            {/* Dedicated Desktop Home Button */}
            <Link
              href="/"
              className="px-3 py-2 rounded-lg hover:bg-[#F6F7F4] text-[#154734] hover:text-[#154734] transition-colors inline-flex items-center gap-1.5 whitespace-nowrap font-bold"
            >
              <Home className="w-4 h-4 text-[#154734]" />
              <span>Home</span>
            </Link>
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

          {/* Right Actions: Search + Track Order + Cart */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Box */}
            <div ref={searchBoxRef} className="hidden md:block relative">
              <form onSubmit={handleSearch} className="flex items-center relative">
                <Search className="w-4 h-4 text-[#6B756D] absolute left-3 pointer-events-none" />
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Search products..."
                  className="w-48 lg:w-64 pl-9 pr-3 py-2 rounded-lg bg-[#F6F7F4] border border-[#E5E8E3] text-xs text-[#141A16] placeholder-[#6B756D] focus:outline-none focus:border-[#154734] focus:bg-white transition-all"
                />
              </form>

              {/* Autocomplete Dropdown */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-[#E5E8E3] shadow-lg z-50 overflow-hidden py-1">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-[#6B756D] uppercase tracking-wider bg-[#F6F7F4] flex items-center justify-between">
                    <span>Quick Suggestions</span>
                    <Clock className="w-3 h-3" />
                  </div>
                  {filteredSuggestions.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => submitSearch(item.query)}
                      className="w-full text-left px-3 py-2 text-xs text-[#141A16] hover:bg-[#EBF5EE] hover:text-[#154734] transition-colors flex items-center justify-between group cursor-pointer"
                    >
                      <span>{item.label}</span>
                      <ChevronRight className="w-3 h-3 text-[#6B756D] group-hover:text-[#154734]" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Track Order Button */}
            <Link
              href="/orders"
              className="px-3 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors border bg-[#F6F7F4] text-[#141A16] border-[#E5E8E3] hover:border-[#154734] hover:text-[#154734]"
              title="Track Your Order"
              aria-label="Track Your Order"
            >
              <PackageCheck className="w-4 h-4 text-[#154734]" />
              <span className="hidden sm:inline">Track Order</span>
            </Link>

            {/* Shopping Cart Button */}
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

      {/* ======================================================== */}
      {/* Mobile Sliding Drawer from the Left                      */}
      {/* ======================================================== */}
      {/* Semi-transparent Backdrop */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300 lg:hidden ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Side Drawer Panel (Slides in from Left) */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-[300px] sm:w-[340px] max-w-[85vw] bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Mobile Navigation"
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E8E3] bg-[#F6F7F4]">
          <Link href="/" onClick={() => setMobileOpen(false)} className="flex items-center">
            <img
              src="/images/evoka-logo.png"
              alt="EVOKA"
              className="h-8 w-auto object-contain"
            />
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg text-[#141A16] hover:bg-white transition-colors cursor-pointer"
            aria-label="Close Navigation Menu"
          >
            <X className="w-5 h-5 text-[#141A16]" />
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Mobile Search */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="w-4 h-4 text-[#6B756D] absolute left-3.5 top-3" />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search detergents, soaps..."
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-[#F6F7F4] border border-[#E5E8E3] focus:outline-none focus:border-[#154734]"
            />
          </form>

          {/* Navigation Links */}
          <div className="space-y-1.5 pt-1">
            {/* Dedicated Home Link */}
            <Link
              href="/"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between p-3 rounded-xl bg-[#EBF5EE] text-[#154734] font-bold text-sm transition-colors border border-[#154734]/15 shadow-2xs"
            >
              <span className="flex items-center gap-3">
                <Home className="w-4 h-4 text-[#154734]" />
                <span>Home</span>
              </span>
              <ChevronRight className="w-4 h-4 text-[#154734]" />
            </Link>

            {/* All Products */}
            <Link
              href="/shop"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between p-3 rounded-xl hover:bg-[#F6F7F4] text-[#141A16] font-semibold text-sm transition-colors"
            >
              <span className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-[#154734]" />
                <span>All Products</span>
              </span>
              <ChevronRight className="w-4 h-4 text-[#6B756D]" />
            </Link>

            {/* Combos Value Packs */}
            <Link
              href="/bundles"
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-between p-3 rounded-xl bg-[#FFF9EB] text-[#B45309] font-bold text-sm transition-colors border border-[#E5A91A]/30"
            >
              <span className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-[#E5A91A]" />
                <span>Combos (-20% OFF)</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#E5A91A] text-[#141A16] font-extrabold uppercase">
                Save
              </span>
            </Link>

            {/* Categories Divider */}
            <div className="pt-2 pb-1 px-1">
              <span className="text-[10px] font-bold text-[#6B756D] uppercase tracking-wider">
                Categories
              </span>
            </div>

            {BRAND.categories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/shop?category=${cat.slug}`}
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#F6F7F4] text-[#141A16] text-xs font-medium transition-colors"
              >
                <span>{cat.name}</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#6B756D]" />
              </Link>
            ))}

            {/* Track Order */}
            <div className="pt-3">
              <Link
                href="/orders"
                onClick={() => setMobileOpen(false)}
                className="flex items-center justify-between p-3 rounded-xl bg-[#154734] text-white font-bold text-sm shadow-xs transition-colors hover:bg-[#1E6B4B]"
              >
                <span className="flex items-center gap-2.5">
                  <PackageCheck className="w-4 h-4 text-[#4ADE80]" />
                  <span>Track / Manage Order</span>
                </span>
                <ChevronRight className="w-4 h-4 text-white/80" />
              </Link>
            </div>
          </div>

          {/* Quick Outlets & Assistance Box */}
          <div className="pt-2 border-t border-[#E5E8E3] space-y-2 text-xs">
            <div className="p-3 rounded-xl bg-[#F6F7F4] space-y-2 border border-[#E5E8E3]">
              <div className="flex items-center gap-2 text-[#154734] font-bold">
                <MapPin className="w-4 h-4" />
                <span>Trivandrum Depots:</span>
              </div>
              <p className="text-[11px] text-[#6B756D] leading-relaxed">
                Poovar Uchakkada &amp; Pallichal Junction. 30-min pickup available.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <a
                href={BRAND.whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#25D366] text-white font-bold text-xs shadow-2xs"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>
              <a
                href={BRAND.phoneHref}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-white border border-[#E5E8E3] text-[#141A16] font-bold text-xs"
              >
                <PhoneCall className="w-4 h-4 text-[#154734]" />
                <span>Call Us</span>
              </a>
            </div>
          </div>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-[#E5E8E3] bg-[#F6F7F4] text-center text-[10px] text-[#6B756D]">
          <span>© {new Date().getFullYear()} EVOKA Home &amp; Personal Care</span>
        </div>
      </div>
    </header>
  );
}
