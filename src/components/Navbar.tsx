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
  Clock,
  ChevronRight,
  UserCheck,
  User,
} from "lucide-react";
import { BRAND } from "@/lib/brand";
import { useCart } from "@/context/CartContext";
import {
  EVOKA_STORAGE_EVENT,
  loadSavedOrders,
  loadSavedProfile,
  SavedOrderRef,
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
  const [showOrdersDropdown, setShowOrdersDropdown] = useState(false);
  const [savedOrders, setSavedOrders] = useState<SavedOrderRef[]>([]);
  const [savedProfile, setSavedProfile] = useState<SavedCustomerProfile | null>(null);
  const [loggedInUser, setLoggedInUser] = useState<{ name: string; phone: string } | null>(null);

  const searchBoxRef = useRef<HTMLDivElement>(null);
  const ordersMenuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Load auto-saved orders & customer profile from localStorage and active session
  const refreshStorage = () => {
    setSavedOrders(loadSavedOrders());
    setSavedProfile(loadSavedProfile());
    fetch("/api/auth/me", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.authenticated && data.user) {
          setLoggedInUser({ name: data.user.name, phone: data.user.phone });
        } else {
          setLoggedInUser(null);
        }
      })
      .catch(() => setLoggedInUser(null));
  };

  useEffect(() => {
    refreshStorage();
    window.addEventListener(EVOKA_STORAGE_EVENT, refreshStorage);
    window.addEventListener("storage", refreshStorage);
    return () => {
      window.removeEventListener(EVOKA_STORAGE_EVENT, refreshStorage);
      window.removeEventListener("storage", refreshStorage);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (searchBoxRef.current && !searchBoxRef.current.contains(target)) {
        setShowSuggestions(false);
      }
      if (ordersMenuRef.current && !ordersMenuRef.current.contains(target)) {
        setShowOrdersDropdown(false);
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

  const latestOrder = savedOrders[0];

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
              No Minimum Order • Cash on Delivery &amp; UPI
            </span>
          </div>

          <div className="hidden md:flex items-center gap-4 shrink-0 text-[11px]">
            {savedProfile?.customerName && (
              <span className="inline-flex items-center gap-1.5 text-white/90 font-medium">
                <UserCheck className="w-3.5 h-3.5 text-[#4ADE80]" />
                <span className="truncate max-w-[150px]">Hi, {savedProfile.customerName.split(" ")[0]}</span>
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
              href={
                latestOrder
                  ? `/orders?id=${latestOrder.id}&phone=${latestOrder.phone}`
                  : savedProfile?.phone
                  ? `/orders?phone=${savedProfile.phone}`
                  : "/orders"
              }
              className="inline-flex items-center gap-1.5 text-white/90 hover:text-white transition-colors"
            >
              <PackageCheck className="w-3.5 h-3.5 text-[#4ADE80]" />
              <span>{savedOrders.length > 0 ? `My Orders (${savedOrders.length})` : "Track Order"}</span>
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

          {/* Right Actions: Search + My Orders Button + Cart */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Box */}
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
                  className="w-48 xl:w-60 pl-9 pr-3 py-2 text-xs rounded-lg bg-[#F6F7F4] border border-[#E5E8E3] focus:outline-none focus:border-[#154734] focus:bg-white transition-all"
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

            {/* MY ORDERS Top Button & Quick-Access Drawer */}
            <div ref={ordersMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setShowOrdersDropdown(!showOrdersDropdown)}
                className={`relative px-3 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer border ${
                  savedOrders.length > 0
                    ? "bg-[#EBF5EE] text-[#154734] border-[#154734]/20 hover:bg-[#154734] hover:text-white"
                    : "bg-[#F6F7F4] text-[#141A16] border-[#E5E8E3] hover:border-[#154734]"
                }`}
                title="View & Track Your Orders"
                aria-label="My Orders"
              >
                <PackageCheck className="w-4 h-4 text-[#154734]" />
                <span className="hidden sm:inline">Orders</span>
                {savedOrders.length > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#154734] text-white text-[10px] font-bold">
                    {savedOrders.length}
                  </span>
                )}
              </button>

              {/* Orders Dropdown */}
              {showOrdersDropdown && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-[#E5E8E3] bg-white shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center justify-between pb-3 border-b border-[#E5E8E3]">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#EBF5EE] text-[#154734] flex items-center justify-center">
                        <PackageCheck className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-[#141A16]">My Recent Orders</h3>
                        <p className="text-[10px] text-[#6B756D]">Auto-saved on this device</p>
                      </div>
                    </div>
                    <Link
                      href={
                        latestOrder
                          ? `/orders?id=${latestOrder.id}&phone=${latestOrder.phone}`
                          : savedProfile?.phone
                          ? `/orders?phone=${savedProfile.phone}`
                          : "/orders"
                      }
                      onClick={() => setShowOrdersDropdown(false)}
                      className="text-[11px] font-bold text-[#154734] hover:underline"
                    >
                      Track Page &rarr;
                    </Link>
                  </div>

                  {savedOrders.length === 0 ? (
                    <div className="py-6 text-center space-y-2">
                      <Clock className="w-8 h-8 text-[#6B756D]/40 mx-auto" />
                      <p className="text-xs text-[#6B756D]">No orders placed on this device yet.</p>
                      <Link
                        href="/orders"
                        onClick={() => setShowOrdersDropdown(false)}
                        className="inline-block text-xs font-bold text-[#154734] hover:underline"
                      >
                        Look up by Order ID &amp; Phone
                      </Link>
                    </div>
                  ) : (
                    <div className="py-2 divide-y divide-[#E5E8E3] max-h-72 overflow-y-auto">
                      {savedOrders.slice(0, 5).map((o) => (
                        <Link
                          key={o.id}
                          href={`/orders?id=${o.id}&phone=${o.phone}`}
                          onClick={() => setShowOrdersDropdown(false)}
                          className="py-2.5 px-2 rounded-xl hover:bg-[#F6F7F4] flex items-center justify-between gap-3 transition-colors group"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-[#141A16] group-hover:text-[#154734]">
                                {o.id}
                              </span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                  o.status === "Delivered"
                                    ? "bg-emerald-100 text-emerald-800"
                                    : o.status === "Cancelled"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-amber-100 text-amber-800"
                                }`}
                              >
                                {o.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#6B756D] truncate mt-0.5">
                              {o.firstItemName}
                              {o.itemCount > 1 ? ` + ${o.itemCount - 1} more` : ""}
                            </p>
                            <p className="text-[10px] text-[#6B756D]">
                              {new Date(o.createdAt).toLocaleDateString("en-IN", {
                                day: "2-digit",
                                month: "short",
                              })}{" "}
                              • ₹{o.total}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#6B756D] group-hover:text-[#154734] shrink-0" />
                        </Link>
                      ))}
                    </div>
                  )}

                  <div className="pt-3 border-t border-[#E5E8E3] flex items-center justify-between text-[11px]">
                    <span className="text-[#6B756D]">
                      {savedProfile?.customerName ? (
                        <>Saved as <strong>{savedProfile.customerName}</strong></>
                      ) : (
                        "Details auto-fill at checkout"
                      )}
                    </span>
                    <Link
                      href="/orders"
                      onClick={() => setShowOrdersDropdown(false)}
                      className="font-bold text-[#154734] hover:underline"
                    >
                      View All
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Customer Account & Profile Link */}
            <Link
              href="/account"
              className={`px-3 py-2 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors cursor-pointer border ${
                loggedInUser
                  ? "bg-[#EBF5EE] text-[#154734] border-[#154734]/20 hover:bg-[#154734] hover:text-white"
                  : "bg-[#F6F7F4] text-[#141A16] border-[#E5E8E3] hover:border-[#154734]"
              }`}
              title="Customer Account, Profile & Saved Addresses"
              aria-label="Account"
            >
              <User className="w-4 h-4 text-[#154734]" />
              <span className="hidden sm:inline">
                {loggedInUser ? loggedInUser.name.split(" ")[0] : "Account"}
              </span>
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

          {/* Mobile Orders Banner if any */}
          {savedOrders.length > 0 && (
            <Link
              href={`/orders?id=${savedOrders[0].id}&phone=${savedOrders[0].phone}`}
              onClick={() => setMobileOpen(false)}
              className="block p-3 rounded-xl bg-[#EBF5EE] border border-[#154734]/20 text-[#154734]"
            >
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4 text-[#154734]" />
                  <span>Latest Order: {savedOrders[0].id}</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white font-bold">
                  {savedOrders[0].status}
                </span>
              </div>
              <p className="text-[11px] text-[#6B756D] mt-1">Tap to track live fulfillment &rarr;</p>
            </Link>
          )}

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
              href="/account"
              onClick={() => setMobileOpen(false)}
              className="p-3 rounded-lg bg-[#EBF5EE] text-[#154734] border border-[#154734]/20 col-span-2 flex items-center justify-between font-bold"
            >
              <span className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#154734]" />
                <span>
                  {loggedInUser ? `Account: ${loggedInUser.name}` : "My Account & Saved Addresses"}
                </span>
              </span>
              <span className="text-[11px] text-[#154734]">&rarr;</span>
            </Link>
            <Link
              href={
                latestOrder
                  ? `/orders?id=${latestOrder.id}&phone=${latestOrder.phone}`
                  : "/orders"
              }
              onClick={() => setMobileOpen(false)}
              className="p-3 rounded-lg bg-[#154734] text-white col-span-2 flex items-center justify-between font-bold"
            >
              <span className="flex items-center gap-2">
                <PackageCheck className="w-4 h-4 text-[#4ADE80]" />
                <span>{savedOrders.length > 0 ? `My Orders (${savedOrders.length})` : "Track Order"}</span>
              </span>
              <span className="text-[11px] text-white/80">&rarr;</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
