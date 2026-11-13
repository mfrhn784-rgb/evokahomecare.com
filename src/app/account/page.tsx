"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  User,
  MapPin,
  Package,
  LogOut,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileText,
  Download,
  AlertCircle,
  Phone,
  Mail,
  Lock,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  ExternalLink,
} from "lucide-react";
import { CustomerAddress, CustomerUser, Order } from "@/lib/types";
import { useCart } from "@/context/CartContext";

export default function AccountPage() {
  const { addItem, openCart } = useCart();

  // Session & Data State
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<"orders" | "addresses" | "profile">("orders");

  // Auth Form State (for unauthenticated users)
  const [authMode, setAuthMode] = useState<"otp" | "password" | "register">("otp");
  const [authPhone, setAuthPhone] = useState("");
  const [authOtp, setAuthOtp] = useState("");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCountdown, setOtpCountdown] = useState(0);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Address Modal/Form State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addrLabel, setAddrLabel] = useState<"Home" | "Work" | "Other">("Home");
  const [addrLine1, setAddrLine1] = useState("");
  const [addrLandmark, setAddrLandmark] = useState("");
  const [addrCity, setAddrCity] = useState("Thiruvananthapuram");
  const [addrState, setAddrState] = useState("Kerala");
  const [addrPincode, setAddrPincode] = useState("");
  const [addrIsDefault, setAddrIsDefault] = useState(false);
  const [addrError, setAddrError] = useState("");
  const [addrSubmitting, setAddrSubmitting] = useState(false);

  // Profile Edit State
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [profileCurrentPassword, setProfileCurrentPassword] = useState("");
  const [profileNewPassword, setProfileNewPassword] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  // Fetch Session Profile on load
  const loadProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      if (res.ok && data.authenticated && data.user) {
        setUser(data.user);
        setOrders(data.orders || []);
        setProfileName(data.user.name || "");
        setProfileEmail(data.user.email || "");
      } else {
        setUser(null);
        setOrders([]);
      }
    } catch (err) {
      console.error("Failed to load customer profile:", err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  // OTP Countdown timer
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  // Request OTP
  const handleSendOtp = async () => {
    setAuthError("");
    setAuthSuccess("");
    const cleanPhone = authPhone.replace(/\D/g, "").slice(-10);
    if (cleanPhone.length !== 10) {
      setAuthError("Please enter a valid 10-digit mobile number.");
      return;
    }

    try {
      setAuthSubmitting(true);
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: cleanPhone }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setAuthError(data.error || "Failed to send OTP.");
      } else {
        setOtpSent(true);
        setOtpCountdown(60);
        setAuthSuccess(data.message || `OTP sent to +91 ${cleanPhone}`);
        if (data.devOtp) {
          setAuthOtp(data.devOtp);
        }
      }
    } catch {
      setAuthError("Network error. Please try again.");
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Login (OTP or Password)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    const cleanPhone = authPhone.replace(/\D/g, "").slice(-10);
    if (cleanPhone.length !== 10) {
      setAuthError("Please enter a valid 10-digit mobile number.");
      return;
    }

    try {
      setAuthSubmitting(true);
      const payload: any = { phone: cleanPhone };
      if (authMode === "otp") {
        if (!authOtp.trim()) {
          setAuthError("Please enter the 6-digit OTP code.");
          setAuthSubmitting(false);
          return;
        }
        payload.otp = authOtp.trim();
      } else {
        if (!authPassword) {
          setAuthError("Please enter your account password.");
          setAuthSubmitting(false);
          return;
        }
        payload.password = authPassword;
      }

      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setAuthError(data.error || "Login failed.");
      } else {
        setAuthSuccess(data.message || "Logged in successfully!");
        await loadProfile();
      }
    } catch {
      setAuthError("Network error. Please try again.");
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Register New Customer
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");

    const cleanPhone = authPhone.replace(/\D/g, "").slice(-10);
    if (!authName.trim()) {
      setAuthError("Please enter your full name.");
      return;
    }
    if (cleanPhone.length !== 10) {
      setAuthError("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!authOtp.trim() && !authPassword) {
      setAuthError("Please request an OTP code or set a password.");
      return;
    }

    try {
      setAuthSubmitting(true);
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: authName.trim(),
          phone: cleanPhone,
          email: authEmail.trim() || undefined,
          password: authPassword || undefined,
          otp: authOtp.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setAuthError(data.error || "Registration failed.");
      } else {
        setAuthSuccess("Account registered! Welcome to EVOKA.");
        await loadProfile();
      }
    } catch {
      setAuthError("Network error. Please try again.");
    } finally {
      setAuthSubmitting(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/me", { method: "DELETE" });
      setUser(null);
      setOrders([]);
      setOtpSent(false);
      setAuthOtp("");
      setAuthPassword("");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Open Address Modal for New / Edit
  const openNewAddress = () => {
    setEditingAddressId(null);
    setAddrLabel("Home");
    setAddrLine1("");
    setAddrLandmark("");
    setAddrCity("Thiruvananthapuram");
    setAddrState("Kerala");
    setAddrPincode("");
    setAddrIsDefault(user?.addresses?.length === 0);
    setAddrError("");
    setShowAddressModal(true);
  };

  const openEditAddress = (addr: CustomerAddress) => {
    setEditingAddressId(addr.id);
    setAddrLabel(addr.label as any);
    setAddrLine1(addr.line1);
    setAddrLandmark(addr.landmark || "");
    setAddrCity(addr.city);
    setAddrState(addr.state);
    setAddrPincode(addr.pincode);
    setAddrIsDefault(Boolean(addr.isDefault));
    setAddrError("");
    setShowAddressModal(true);
  };

  // Save Address (Create or Update)
  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddrError("");

    if (!addrLine1.trim() || addrLine1.trim().length < 5) {
      setAddrError("Please enter your complete street or apartment address.");
      return;
    }
    if (!addrCity.trim()) {
      setAddrError("City/District is required.");
      return;
    }
    if (!/^\d{6}$/.test(addrPincode.trim())) {
      setAddrError("Please enter a valid 6-digit postal PIN code.");
      return;
    }

    try {
      setAddrSubmitting(true);
      const isEdit = Boolean(editingAddressId);
      const url = "/api/auth/addresses";
      const method = isEdit ? "PUT" : "POST";
      const payload: any = {
        label: addrLabel,
        line1: addrLine1.trim(),
        landmark: addrLandmark.trim() || undefined,
        city: addrCity.trim(),
        state: addrState.trim(),
        pincode: addrPincode.trim(),
        isDefault: addrIsDefault,
      };
      if (isEdit) payload.id = editingAddressId;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setAddrError(data.error || "Failed to save address.");
      } else {
        setShowAddressModal(false);
        if (data.addresses && user) {
          setUser({ ...user, addresses: data.addresses });
        } else {
          await loadProfile();
        }
      }
    } catch {
      setAddrError("Network error. Please try again.");
    } finally {
      setAddrSubmitting(false);
    }
  };

  // Delete Address
  const handleDeleteAddress = async (id: string) => {
    if (!confirm("Are you sure you want to delete this saved address?")) return;
    try {
      const res = await fetch(`/api/auth/addresses?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        if (user && data.addresses) {
          setUser({ ...user, addresses: data.addresses });
        } else {
          await loadProfile();
        }
      }
    } catch (err) {
      console.error("Delete address error:", err);
    }
  };

  // Set Address as Default
  const handleSetDefaultAddress = async (id: string) => {
    try {
      const res = await fetch("/api/auth/addresses", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "set_default", id }),
      });
      const data = await res.json();
      if (res.ok && data.ok && user) {
        setUser({
          ...user,
          addresses: data.addresses,
          defaultAddressId: id,
        });
      }
    } catch (err) {
      console.error("Set default address error:", err);
    }
  };

  // Update Profile Info
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileMessage("");

    if (!profileName.trim() || profileName.trim().length < 2) {
      setProfileError("Full name must be at least 2 characters.");
      return;
    }

    try {
      setProfileSubmitting(true);
      const payload: any = {
        name: profileName.trim(),
        email: profileEmail.trim() || undefined,
      };

      if (profileNewPassword) {
        if (profileNewPassword.length < 6) {
          setProfileError("New password must be at least 6 characters.");
          setProfileSubmitting(false);
          return;
        }
        payload.newPassword = profileNewPassword;
        payload.currentPassword = profileCurrentPassword || undefined;
      }

      const res = await fetch("/api/auth/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setProfileError(data.error || "Failed to update profile.");
      } else {
        setProfileMessage("Profile updated successfully!");
        setProfileNewPassword("");
        setProfileCurrentPassword("");
        if (data.user && user) {
          setUser({ ...user, ...data.user });
        }
      }
    } catch {
      setProfileError("Network error. Please try again.");
    } finally {
      setProfileSubmitting(false);
    }
  };

  // Re-order items
  const handleReorder = (order: Order) => {
    order.items.forEach((item) => {
      addItem(
        {
          productId: item.productId,
          variantId: item.variantId,
          name: item.name,
          variantLabel: item.variantLabel,
          price: item.price,
          mrp: item.mrp || item.price,
          image: item.image,
          slug: item.slug || "product",
        },
        item.quantity
      );
    });
    openCart();
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center py-20 px-4">
        <div className="w-12 h-12 border-4 border-[#154734]/20 border-t-[#154734] rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-[#6B756D]">Loading your EVOKA account...</p>
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: UNAUTHENTICATED (LOGIN / REGISTER)
  // =========================================================================
  if (!user) {
    return (
      <div className="min-h-screen bg-[#F6F7F4] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto">
          {/* Brand header */}
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EBF5EE] text-[#154734] text-xs font-bold mb-3">
              <ShieldCheck className="w-4 h-4 text-[#154734]" />
              Official EVOKA Customer Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#141A16] tracking-tight">
              Sign In to Your Account
            </h1>
            <p className="text-xs sm:text-sm text-[#6B756D] mt-1.5">
              Access your previous orders, saved delivery addresses, and invoices.
            </p>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="bg-white rounded-2xl shadow-sm border border-[#E5E8E3] overflow-hidden">
            <div className="grid grid-cols-3 border-b border-[#E5E8E3] bg-[#FAFBF9] text-xs font-bold text-center">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("otp");
                  setAuthError("");
                  setAuthSuccess("");
                }}
                className={`py-3 transition-colors ${
                  authMode === "otp"
                    ? "bg-white text-[#154734] border-b-2 border-[#154734]"
                    : "text-[#6B756D] hover:text-[#141A16]"
                }`}
              >
                Phone OTP
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("password");
                  setAuthError("");
                  setAuthSuccess("");
                }}
                className={`py-3 transition-colors ${
                  authMode === "password"
                    ? "bg-white text-[#154734] border-b-2 border-[#154734]"
                    : "text-[#6B756D] hover:text-[#141A16]"
                }`}
              >
                Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode("register");
                  setAuthError("");
                  setAuthSuccess("");
                }}
                className={`py-3 transition-colors ${
                  authMode === "register"
                    ? "bg-white text-[#154734] border-b-2 border-[#154734]"
                    : "text-[#6B756D] hover:text-[#141A16]"
                }`}
              >
                Register
              </button>
            </div>

            <div className="p-6">
              {authError && (
                <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              {authSuccess && (
                <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{authSuccess}</span>
                </div>
              )}

              {/* Mode: PHONE OTP */}
              {authMode === "otp" && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#141A16] mb-1">
                      Mobile Number
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-2.5 text-xs font-bold text-[#6B756D]">
                        +91
                      </div>
                      <input
                        type="tel"
                        maxLength={10}
                        value={authPhone}
                        onChange={(e) => setAuthPhone(e.target.value.replace(/\D/g, ""))}
                        placeholder="9143374741"
                        className="w-full pl-12 pr-3 py-2 text-sm rounded-xl border border-[#E5E8E3] focus:border-[#154734] focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  {otpSent ? (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-bold text-[#141A16]">
                          6-Digit Verification Code
                        </label>
                        <button
                          type="button"
                          disabled={otpCountdown > 0 || authSubmitting}
                          onClick={handleSendOtp}
                          className="text-[11px] font-bold text-[#154734] hover:underline disabled:opacity-50"
                        >
                          {otpCountdown > 0 ? `Resend in ${otpCountdown}s` : "Resend OTP"}
                        </button>
                      </div>
                      <input
                        type="text"
                        maxLength={6}
                        value={authOtp}
                        onChange={(e) => setAuthOtp(e.target.value)}
                        placeholder="Enter 6-digit code (e.g. 123456)"
                        className="w-full px-3 py-2 text-sm tracking-widest text-center font-mono rounded-xl border border-[#E5E8E3] focus:border-[#154734] focus:outline-none"
                        required
                        autoFocus
                      />
                      <p className="text-[11px] text-[#6B756D] mt-1.5 text-center">
                        Tip: You can use verification code <strong className="text-[#154734]">123456</strong> for instant sign-in.
                      </p>

                      <button
                        type="submit"
                        disabled={authSubmitting}
                        className="w-full mt-4 py-3 rounded-xl bg-[#154734] text-white font-bold text-sm hover:bg-[#1E6B4B] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {authSubmitting ? "Verifying..." : "Verify & Sign In"}
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={authSubmitting}
                      onClick={handleSendOtp}
                      className="w-full py-3 rounded-xl bg-[#154734] text-white font-bold text-sm hover:bg-[#1E6B4B] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {authSubmitting ? "Sending OTP..." : "Send Verification Code"}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </form>
              )}

              {/* Mode: PASSWORD */}
              {authMode === "password" && (
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-[#141A16] mb-1">
                      Registered Mobile Number
                    </label>
                    <div className="relative">
                      <div className="absolute left-3 top-2.5 text-xs font-bold text-[#6B756D]">
                        +91
                      </div>
                      <input
                        type="tel"
                        maxLength={10}
                        value={authPhone}
                        onChange={(e) => setAuthPhone(e.target.value.replace(/\D/g, ""))}
                        placeholder="9143374741"
                        className="w-full pl-12 pr-3 py-2 text-sm rounded-xl border border-[#E5E8E3] focus:border-[#154734] focus:outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-[#141A16]">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => setAuthMode("otp")}
                        className="text-[11px] font-bold text-[#154734] hover:underline"
                      >
                        Forgot password? Use OTP
                      </button>
                    </div>
                    <input
                      type="password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="Your account password"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-[#E5E8E3] focus:border-[#154734] focus:outline-none"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authSubmitting}
                    className="w-full py-3 rounded-xl bg-[#154734] text-white font-bold text-sm hover:bg-[#1E6B4B] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {authSubmitting ? "Signing In..." : "Sign In with Password"}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {/* Mode: REGISTER */}
              {authMode === "register" && (
                <form onSubmit={handleRegister} className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-[#141A16] mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="e.g. Farhan Muhammed"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-[#E5E8E3] focus:border-[#154734] focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#141A16] mb-1">
                      Mobile Number *
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <div className="absolute left-3 top-2.5 text-xs font-bold text-[#6B756D]">
                          +91
                        </div>
                        <input
                          type="tel"
                          maxLength={10}
                          value={authPhone}
                          onChange={(e) => setAuthPhone(e.target.value.replace(/\D/g, ""))}
                          placeholder="9143374741"
                          className="w-full pl-12 pr-3 py-2 text-sm rounded-xl border border-[#E5E8E3] focus:border-[#154734] focus:outline-none"
                          required
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={otpCountdown > 0 || authSubmitting}
                        className="px-3 py-2 rounded-xl bg-[#EBF5EE] text-[#154734] text-xs font-bold border border-[#154734]/20 hover:bg-[#154734] hover:text-white transition-colors disabled:opacity-50 shrink-0"
                      >
                        {otpCountdown > 0 ? `${otpCountdown}s` : "Get OTP"}
                      </button>
                    </div>
                  </div>

                  {otpSent && (
                    <div>
                      <label className="block text-xs font-bold text-[#141A16] mb-1">
                        Enter 6-Digit OTP *
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={authOtp}
                        onChange={(e) => setAuthOtp(e.target.value)}
                        placeholder="Code from SMS (or 123456)"
                        className="w-full px-3 py-2 text-sm tracking-widest text-center font-mono rounded-xl border border-[#E5E8E3] focus:border-[#154734] focus:outline-none"
                        required
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-[#141A16] mb-1">
                      Email Address <span className="text-[#6B756D] font-normal">(Optional, for invoices)</span>
                    </label>
                    <input
                      type="email"
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="farhan@example.com"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-[#E5E8E3] focus:border-[#154734] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#141A16] mb-1">
                      Set Password <span className="text-[#6B756D] font-normal">(Optional)</span>
                    </label>
                    <input
                      type="password"
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-[#E5E8E3] focus:border-[#154734] focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={authSubmitting}
                    className="w-full mt-4 py-3 rounded-xl bg-[#154734] text-white font-bold text-sm hover:bg-[#1E6B4B] transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {authSubmitting ? "Creating Account..." : "Create Account & Sign In"}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>

            {/* Guest Checkout Notice */}
            <div className="bg-[#FAFBF9] px-6 py-4 border-t border-[#E5E8E3] text-center text-xs text-[#6B756D]">
              <span>Don&apos;t want an account right now? </span>
              <Link href="/shop" className="font-bold text-[#154734] hover:underline">
                Continue as Guest &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: AUTHENTICATED CUSTOMER DASHBOARD
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#F6F7F4] py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        {/* Customer Header Banner */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#E5E8E3] mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#EBF5EE] border border-[#154734]/20 flex items-center justify-center text-[#154734] font-extrabold text-xl shadow-inner">
                {user.name ? user.name.charAt(0).toUpperCase() : "E"}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-extrabold text-[#141A16]">
                    {user.name}
                  </h1>
                  <span className="px-2 py-0.5 rounded-full bg-[#EBF5EE] text-[#154734] text-[10px] font-extrabold uppercase">
                    Verified Customer
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs text-[#6B756D] mt-1">
                  <span className="inline-flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-[#154734]" />
                    +91 {user.phone}
                  </span>
                  {user.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-[#154734]" />
                      {user.email}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Link
                href="/shop"
                className="px-4 py-2 rounded-xl bg-[#EBF5EE] text-[#154734] border border-[#154734]/20 text-xs font-bold hover:bg-[#154734] hover:text-white transition-colors inline-flex items-center gap-1.5"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Shop Catalog</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-[#F6F7F4] text-[#6B756D] hover:text-red-600 hover:bg-red-50 text-xs font-bold transition-colors inline-flex items-center gap-1.5 border border-[#E5E8E3]"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 border-t border-[#E5E8E3] mt-6 pt-4 overflow-x-auto text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("orders")}
              className={`px-4 py-2.5 rounded-xl transition-all inline-flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === "orders"
                  ? "bg-[#154734] text-white shadow-sm"
                  : "bg-[#F6F7F4] text-[#6B756D] hover:text-[#141A16]"
              }`}
            >
              <Package className="w-4 h-4" />
              <span>My Orders ({orders.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("addresses")}
              className={`px-4 py-2.5 rounded-xl transition-all inline-flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === "addresses"
                  ? "bg-[#154734] text-white shadow-sm"
                  : "bg-[#F6F7F4] text-[#6B756D] hover:text-[#141A16]"
              }`}
            >
              <MapPin className="w-4 h-4" />
              <span>Saved Addresses ({user.addresses?.length || 0})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("profile")}
              className={`px-4 py-2.5 rounded-xl transition-all inline-flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                activeTab === "profile"
                  ? "bg-[#154734] text-white shadow-sm"
                  : "bg-[#F6F7F4] text-[#6B756D] hover:text-[#141A16]"
              }`}
            >
              <User className="w-4 h-4" />
              <span>Profile Settings</span>
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* TAB 1: MY ORDERS */}
        {/* =================================================================== */}
        {activeTab === "orders" && (
          <div className="space-y-4">
            {orders.length === 0 ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-[#E5E8E3] shadow-sm">
                <Package className="w-12 h-12 text-[#6B756D]/40 mx-auto mb-3" />
                <h3 className="text-base font-bold text-[#141A16]">No Orders Found</h3>
                <p className="text-xs text-[#6B756D] max-w-sm mx-auto mt-1 mb-6">
                  You haven&apos;t placed any orders with this phone number yet. Explore our factory-direct home hygiene solutions!
                </p>
                <Link
                  href="/shop"
                  className="px-6 py-2.5 rounded-xl bg-[#154734] text-white text-xs font-bold hover:bg-[#1E6B4B] transition-colors inline-flex items-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4 text-[#E5A91A]" />
                  <span>Start Shopping</span>
                </Link>
              </div>
            ) : (
              orders.map((order) => {
                const isPaid = order.paymentStatus === "PAID" || order.paymentStatus === "Paid";
                const isCod = order.paymentMethod === "cod";
                const isEligibleForInvoice =
                  Boolean(order.invoice) ||
                  isPaid ||
                  order.status === "Confirmed" ||
                  order.status === "Packed" ||
                  order.status === "Shipped" ||
                  order.status === "Delivered";

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-[#E5E8E3] transition-all hover:border-[#154734]/30"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#E5E8E3] gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-[#141A16]">
                            {order.id}
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              order.status === "Delivered"
                                ? "bg-emerald-100 text-emerald-800"
                                : order.status === "Shipped"
                                ? "bg-blue-100 text-blue-800"
                                : order.status === "Cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {order.status}
                          </span>
                        </div>
                        <p className="text-xs text-[#6B756D] mt-0.5">
                          Placed on{" "}
                          {new Date(order.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        {isEligibleForInvoice && (
                          <a
                            href={`/api/orders/${encodeURIComponent(order.id)}/invoice?download=1`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 rounded-lg bg-[#EBF5EE] text-[#154734] border border-[#154734]/20 hover:bg-[#154734] hover:text-white transition-colors text-xs font-bold inline-flex items-center gap-1.5"
                            title="Download Official Tax Invoice PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download PDF Invoice</span>
                          </a>
                        )}
                        <Link
                          href={`/orders?id=${order.id}&phone=${order.phone}`}
                          className="px-3 py-1.5 rounded-lg bg-[#F6F7F4] text-[#141A16] border border-[#E5E8E3] hover:border-[#154734] transition-colors text-xs font-bold inline-flex items-center gap-1"
                        >
                          <span>Live Tracking</span>
                          <ExternalLink className="w-3.5 h-3.5 text-[#6B756D]" />
                        </Link>
                      </div>
                    </div>

                    {/* Products list */}
                    <div className="py-4 space-y-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#F6F7F4] border border-[#E5E8E3] flex items-center justify-center overflow-hidden shrink-0">
                              {item.image ? (
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="w-4 h-4 text-[#6B756D]" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-[#141A16] line-clamp-1">{item.name}</p>
                              <p className="text-[11px] text-[#6B756D]">
                                {item.variantLabel} &times; {item.quantity}
                              </p>
                            </div>
                          </div>
                          <span className="font-bold text-[#141A16]">
                            ₹{item.price * item.quantity}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Footer summary & actions */}
                    <div className="pt-4 border-t border-[#E5E8E3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <span className="text-[#6B756D]">Payment: </span>
                        <strong className="text-[#141A16] uppercase font-bold">
                          {order.paymentMethod === "upi"
                            ? "UPI Prepaid"
                            : order.paymentMethod === "cod"
                            ? "Cash on Delivery"
                            : order.paymentMethod}
                        </strong>
                        <span className="mx-2 text-[#E5E8E3]">|</span>
                        <span
                          className={`font-bold ${
                            isPaid
                              ? "text-emerald-700"
                              : isCod
                              ? "text-amber-700"
                              : "text-blue-700"
                          }`}
                        >
                          {order.paymentStatus}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-extrabold text-[#154734]">
                          Total: ₹{order.total}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleReorder(order)}
                          className="px-3 py-1.5 rounded-lg bg-[#154734] text-white font-bold hover:bg-[#1E6B4B] transition-colors inline-flex items-center gap-1.5"
                        >
                          <ShoppingBag className="w-3.5 h-3.5 text-[#E5A91A]" />
                          <span>Buy Again</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: SAVED ADDRESSES */}
        {/* =================================================================== */}
        {activeTab === "addresses" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-extrabold text-[#141A16]">Saved Delivery Addresses</h2>
                <p className="text-xs text-[#6B756D]">
                  Manage addresses for 1-click automatic checkout population.
                </p>
              </div>
              <button
                type="button"
                onClick={openNewAddress}
                className="px-4 py-2 rounded-xl bg-[#154734] text-white text-xs font-bold hover:bg-[#1E6B4B] transition-colors inline-flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add New Address</span>
              </button>
            </div>

            {(!user.addresses || user.addresses.length === 0) ? (
              <div className="bg-white rounded-2xl p-12 text-center border border-[#E5E8E3] shadow-sm">
                <MapPin className="w-12 h-12 text-[#6B756D]/40 mx-auto mb-3" />
                <h3 className="text-base font-bold text-[#141A16]">No Saved Addresses</h3>
                <p className="text-xs text-[#6B756D] max-w-sm mx-auto mt-1 mb-6">
                  Save your home, apartment, or office address once to enjoy super-fast checkouts without re-typing.
                </p>
                <button
                  type="button"
                  onClick={openNewAddress}
                  className="px-6 py-2.5 rounded-xl bg-[#154734] text-white text-xs font-bold hover:bg-[#1E6B4B] transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add First Address</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {user.addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`bg-white rounded-2xl p-5 border shadow-sm relative transition-all ${
                      addr.isDefault || user.defaultAddressId === addr.id
                        ? "border-[#154734] ring-1 ring-[#154734]"
                        : "border-[#E5E8E3] hover:border-[#154734]/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-[#F6F7F4] text-[#141A16] font-bold text-[11px] border border-[#E5E8E3]">
                          {addr.label}
                        </span>
                        {(addr.isDefault || user.defaultAddressId === addr.id) && (
                          <span className="px-2 py-0.5 rounded-full bg-[#EBF5EE] text-[#154734] text-[10px] font-extrabold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-[#154734]" />
                            Default Delivery
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEditAddress(addr)}
                          className="p-1.5 rounded-lg text-[#6B756D] hover:text-[#154734] hover:bg-[#F6F7F4] transition-colors"
                          title="Edit Address"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="p-1.5 rounded-lg text-[#6B756D] hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete Address"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-[#141A16] line-clamp-2">
                      {addr.line1}
                    </p>
                    {addr.landmark && (
                      <p className="text-[11px] text-[#6B756D] mt-0.5">
                        Landmark: {addr.landmark}
                      </p>
                    )}
                    <p className="text-xs text-[#6B756D] mt-1 font-medium">
                      {addr.city}, {addr.state} - <strong className="text-[#141A16]">{addr.pincode}</strong>
                    </p>

                    {!(addr.isDefault || user.defaultAddressId === addr.id) && (
                      <button
                        type="button"
                        onClick={() => handleSetDefaultAddress(addr.id)}
                        className="mt-4 text-[11px] font-bold text-[#154734] hover:underline"
                      >
                        Set as Default Address &rarr;
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: PROFILE SETTINGS */}
        {/* =================================================================== */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-[#E5E8E3] max-w-2xl">
            <h2 className="text-base font-extrabold text-[#141A16] mb-1">Customer Profile Details</h2>
            <p className="text-xs text-[#6B756D] mb-6">
              Update your registered customer information and account security.
            </p>

            {profileError && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{profileError}</span>
              </div>
            )}

            {profileMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{profileMessage}</span>
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#141A16] mb-1">Full Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#E5E8E3] focus:border-[#154734] focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#141A16] mb-1">
                  Primary Mobile Number
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-2.5 text-xs font-bold text-[#6B756D]">+91</div>
                  <input
                    type="text"
                    disabled
                    value={user.phone}
                    className="w-full pl-12 pr-3 py-2 text-sm rounded-xl border border-[#E5E8E3] bg-[#F6F7F4] text-[#6B756D] cursor-not-allowed"
                  />
                </div>
                <p className="text-[10px] text-[#6B756D] mt-1">
                  To change your registered mobile number, contact support or log in with your new number.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#141A16] mb-1">Email Address</label>
                <input
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  placeholder="For automated invoices and order receipts"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-[#E5E8E3] focus:border-[#154734] focus:outline-none"
                />
              </div>

              <div className="pt-4 border-t border-[#E5E8E3]">
                <h3 className="text-xs font-bold text-[#141A16] uppercase tracking-wider mb-3">
                  Account Password (Optional)
                </h3>
                <div className="space-y-3">
                  {user.passwordHash && (
                    <div>
                      <label className="block text-xs font-bold text-[#141A16] mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={profileCurrentPassword}
                        onChange={(e) => setProfileCurrentPassword(e.target.value)}
                        placeholder="Enter existing password to verify"
                        className="w-full px-3 py-2 text-sm rounded-xl border border-[#E5E8E3] focus:border-[#154734] focus:outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-[#141A16] mb-1">
                      {user.passwordHash ? "New Password" : "Set Account Password"}
                    </label>
                    <input
                      type="password"
                      value={profileNewPassword}
                      onChange={(e) => setProfileNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-[#E5E8E3] focus:border-[#154734] focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={profileSubmitting}
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-[#154734] text-white text-xs font-bold hover:bg-[#1E6B4B] transition-colors disabled:opacity-50"
              >
                {profileSubmitting ? "Saving Changes..." : "Save Profile Details"}
              </button>
            </form>
          </div>
        )}

        {/* =================================================================== */}
        {/* MODAL: ADD / EDIT ADDRESS */}
        {/* =================================================================== */}
        {showAddressModal && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E5E8E3] animate-in fade-in">
              <div className="flex items-center justify-between pb-4 border-b border-[#E5E8E3]">
                <h3 className="text-base font-extrabold text-[#141A16]">
                  {editingAddressId ? "Edit Delivery Address" : "Add New Delivery Address"}
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="text-xs text-[#6B756D] hover:text-[#141A16]"
                >
                  Cancel
                </button>
              </div>

              {addrError && (
                <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{addrError}</span>
                </div>
              )}

              <form onSubmit={handleSaveAddress} className="mt-4 space-y-3.5">
                {/* Label selector */}
                <div>
                  <label className="block text-xs font-bold text-[#141A16] mb-1.5">
                    Address Label
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["Home", "Work", "Other"] as const).map((lbl) => (
                      <button
                        key={lbl}
                        type="button"
                        onClick={() => setAddrLabel(lbl)}
                        className={`py-2 text-xs font-bold rounded-xl border transition-all cursor-pointer ${
                          addrLabel === lbl
                            ? "bg-[#154734] text-white border-[#154734]"
                            : "bg-[#F6F7F4] text-[#141A16] border-[#E5E8E3] hover:border-[#154734]"
                        }`}
                      >
                        {lbl}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#141A16] mb-1">
                    House / Flat / Building / Street Address *
                  </label>
                  <input
                    type="text"
                    value={addrLine1}
                    onChange={(e) => setAddrLine1(e.target.value)}
                    placeholder="e.g. TC 14/235, Green Valley, MG Road"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#E5E8E3] focus:border-[#154734] focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#141A16] mb-1">
                    Landmark <span className="text-[#6B756D] font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    value={addrLandmark}
                    onChange={(e) => setAddrLandmark(e.target.value)}
                    placeholder="e.g. Near St. Joseph Church"
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#E5E8E3] focus:border-[#154734] focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-[#141A16] mb-1">
                      City / District *
                    </label>
                    <input
                      type="text"
                      value={addrCity}
                      onChange={(e) => setAddrCity(e.target.value)}
                      placeholder="Thiruvananthapuram"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-[#E5E8E3] focus:border-[#154734] focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#141A16] mb-1">
                      PIN Code *
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={addrPincode}
                      onChange={(e) => setAddrPincode(e.target.value.replace(/\D/g, ""))}
                      placeholder="695001"
                      className="w-full px-3 py-2 text-sm rounded-xl border border-[#E5E8E3] focus:border-[#154734] focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#141A16] mb-1">State</label>
                  <input
                    type="text"
                    value={addrState}
                    onChange={(e) => setAddrState(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-[#E5E8E3] focus:border-[#154734] focus:outline-none"
                    required
                  />
                </div>

                <label className="flex items-center gap-2 pt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={addrIsDefault}
                    onChange={(e) => setAddrIsDefault(e.target.checked)}
                    className="w-4 h-4 text-[#154734] rounded accent-[#154734]"
                  />
                  <span className="text-xs font-semibold text-[#141A16]">
                    Set as my default delivery address
                  </span>
                </label>

                <div className="pt-4 flex items-center justify-end gap-2 border-t border-[#E5E8E3]">
                  <button
                    type="button"
                    onClick={() => setShowAddressModal(false)}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-[#6B756D] hover:bg-[#F6F7F4]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={addrSubmitting}
                    className="px-5 py-2 rounded-xl bg-[#154734] text-white text-xs font-bold hover:bg-[#1E6B4B] transition-colors disabled:opacity-50"
                  >
                    {addrSubmitting ? "Saving..." : "Save Address"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
