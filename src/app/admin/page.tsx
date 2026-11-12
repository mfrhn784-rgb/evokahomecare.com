"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  ShieldCheck,
  Upload,
  Download,
  Plus,
  Trash2,
  Package,
  ShoppingBag,
  AlertTriangle,
  LogOut,
  Search,
  Printer,
  Check,
  ImagePlus,
  Tag,
  Save,
  FileText,
  Eye,
  X,
  CheckCircle2,
  XCircle,
  QrCode,
  Banknote,
} from "lucide-react";
import { CategorySlug, Order, OrderStatus, PaymentStatus, Product, ProductVariant } from "@/lib/types";
import { BRAND } from "@/lib/brand";
import { SafeImage, getCategoryFallbackImage } from "@/components/SafeImage";

const ORDER_STATUSES: OrderStatus[] = [
  "PENDING_CONFIRMATION",
  "Pending",
  "Confirmed",
  "Packed",
  "Shipped",
  "Delivered",
  "Cancelled",
];

const PAYMENT_STATUSES: PaymentStatus[] = [
  "PAYMENT_UNDER_REVIEW",
  "PAID",
  "REJECTED",
  "NOT_PAID",
  "COD",
  "Paid",
  "Pending",
  "Refunded",
];

function checkInvoiceEligibility(order: Order): { eligible: boolean; reason?: string } {
  if (order.status === "Cancelled") {
    return { eligible: false, reason: "Cancelled order — invoice locked." };
  }
  if (order.paymentStatus === "REJECTED") {
    return { eligible: false, reason: "Rejected payment — invoice locked." };
  }
  if (order.paymentMethod === "upi") {
    if (order.paymentStatus !== "PAID" && order.paymentStatus !== "Paid") {
      return { eligible: false, reason: "Verify UPI payment against bank funds to unlock invoice." };
    }
  } else {
    const confirmed: OrderStatus[] = ["Confirmed", "Packed", "Shipped", "Delivered"];
    if (!confirmed.includes(order.status)) {
      return { eligible: false, reason: "Confirm COD order to unlock invoice." };
    }
  }
  return { eligible: true };
}

export default function AdminPage() {
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [authError, setAuthError] = useState("");

  const [tab, setTab] = useState<"orders" | "rates" | "products" | "bulk">("rates");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [csvMode, setCsvMode] = useState<"merge" | "replace">("merge");

  // Rate Manager state
  const [rateCategory, setRateCategory] = useState<string>("all");
  const [rateSearch, setRateSearch] = useState<string>("");
  const [mrpDrafts, setMrpDrafts] = useState<Record<string, string>>({});
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});

  // Order fulfillment filters & draft tracking edits
  const [orderPaymentView, setOrderPaymentView] = useState<"all" | "upi" | "cod">("all");
  const [orderFilter, setOrderFilter] = useState<"All" | OrderStatus>("All");
  const [orderSearch, setOrderSearch] = useState("");
  const [trackingDrafts, setTrackingDrafts] = useState<
    Record<string, { courierName: string; trackingNumber: string }>
  >({});
  const [previewScreenshotUrl, setPreviewScreenshotUrl] = useState<string | null>(null);
  const [previewInvoiceOrder, setPreviewInvoiceOrder] = useState<Order | null>(null);
  const [generatingInvoiceId, setGeneratingInvoiceId] = useState<string | null>(null);

  // Quick Product Add
  const [name, setName] = useState("");
  const [category, setCategory] = useState<CategorySlug>("laundry-care");
  const [tagline, setTagline] = useState("");
  const [scent, setScent] = useState("Lavender");
  const [variantLabel, setVariantLabel] = useState("1L");
  const [price, setPrice] = useState("219");
  const [mrp, setMrp] = useState("269");
  const [stock, setStock] = useState("50");
  const [sku, setSku] = useState("");

  // Inline price edits keyed by variant id
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});

  const fetchData = async () => {
    const [ordRes, prodRes] = await Promise.all([fetch("/api/orders"), fetch("/api/products")]);
    if (!ordRes.ok) return false;
    const ordData = await ordRes.json();
    const prodData = await prodRes.json();
    const loadedOrders: Order[] = ordData.orders || [];
    const loadedProducts: Product[] = prodData.products || [];
    setOrders(loadedOrders);
    setProducts(loadedProducts);

    const drafts: Record<string, { courierName: string; trackingNumber: string }> = {};
    for (const o of loadedOrders) {
      drafts[o.id] = {
        courierName: o.courierName || "",
        trackingNumber: o.trackingNumber || "",
      };
    }
    setTrackingDrafts(drafts);

    const pDrafts: Record<string, string> = {};
    const mDrafts: Record<string, string> = {};
    const sDrafts: Record<string, string> = {};
    for (const p of loadedProducts) {
      for (const v of p.variants) {
        pDrafts[v.id] = String(v.price);
        mDrafts[v.id] = String(v.mrp);
        sDrafts[v.id] = String(v.stock);
      }
    }
    setPriceDrafts(pDrafts);
    setMrpDrafts(mDrafts);
    setStockDrafts(sDrafts);
    return true;
  };

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/auth");
        const data = await res.json();
        if (data.authenticated) {
          const ok = await fetchData();
          if (ok) setUnlocked(true);
        }
      } finally {
        setCheckingSession(false);
      }
    })();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    const data = await res.json();
    if (!res.ok) {
      setAuthError(data.error || "Invalid Admin PIN.");
      return;
    }
    await fetchData();
    setUnlocked(true);
    setPin("");
  };

  const handleLogout = async () => {
    await fetch("/api/admin/auth", { method: "DELETE" });
    setUnlocked(false);
    setOrders([]);
  };

  const updateOrder = async (
    orderId: string,
    updates: {
      adminAction?: "verify_payment" | "reject_payment" | "confirm_cod";
      reason?: string;
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      courierName?: string;
      trackingNumber?: string;
    }
  ) => {
    const res = await fetch("/api/orders", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, ...updates }),
    });
    const data = await res.json();
    if (res.ok && data.order) {
      setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
      setStatusMsg(`Updated order ${orderId}`);
    } else if (data.error) {
      setStatusMsg(data.error);
    }
  };

  const handleGenerateInvoice = async (orderId: string) => {
    setGeneratingInvoiceId(orderId);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/invoice`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMsg(data.error || "Could not generate invoice.");
        return null;
      }
      setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
      setStatusMsg(
        data.newlyGenerated
          ? `Generated Invoice ${data.invoice.invoiceNumber}`
          : `Loaded Invoice ${data.invoice.invoiceNumber}`
      );
      return data.order as Order;
    } finally {
      setGeneratingInvoiceId(null);
    }
  };

  const handlePrintInvoicePdf = async (order: Order) => {
    const updated = order.invoice ? order : await handleGenerateInvoice(order.id);
    if (!updated) return;
    const pdfUrl = `/api/orders/${encodeURIComponent(order.id)}/invoice`;
    const win = window.open(pdfUrl, "_blank");
    if (win) {
      win.addEventListener("load", () => {
        try {
          win.print();
        } catch {
          // User can print from PDF viewer toolbar
        }
      });
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const catName = BRAND.categories.find((c) => c.slug === category)?.name || "Laundry Detergents";
    const defaultImg =
      BRAND.categories.find((c) => c.slug === category)?.image ||
      "/images/detergent-matic-royal-rose-1l.jpg";

    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        category,
        categoryName: catName,
        shortTagline: tagline || "Commercial-strength formulation crafted for everyday home care.",
        description: tagline || "Crafted by EVOKA Home & Personal Care.",
        scent,
        image: defaultImg,
        variants: [
          {
            id: `v-${Date.now()}`,
            label: variantLabel,
            price: Number(price),
            mrp: Number(mrp),
            stock: Number(stock),
            sku: sku || `EVK-${Date.now().toString().slice(-4)}`,
          },
        ],
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setProducts(data.products);
      setName("");
      setTagline("");
      setSku("");
      setStatusMsg("Product added to catalog!");
    } else {
      setStatusMsg(data.error || "Failed to add product.");
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!window.confirm("Remove this product from the store?")) return;
    const res = await fetch(`/api/products?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res.ok) {
      const data = await res.json();
      setProducts(data.products);
      setStatusMsg("Product removed.");
    }
  };

  const handleVariantUpdate = async (
    product: Product,
    variantIdx: number,
    patch: { stock?: number; price?: number }
  ) => {
    const updated: Product = {
      ...product,
      variants: product.variants.map((v, i) => {
        if (i !== variantIdx) return v;
        const nextPrice = patch.price !== undefined ? Math.max(1, patch.price) : v.price;
        return {
          ...v,
          stock: patch.stock !== undefined ? Math.max(0, patch.stock) : v.stock,
          price: nextPrice,
          mrp: patch.price !== undefined && v.mrp < nextPrice ? Math.round(nextPrice * 1.2) : v.mrp,
        };
      }),
    };
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    if (res.ok) {
      const data = await res.json();
      setProducts(data.products);
      setStatusMsg(`Updated ${product.name}`);
    }
  };

  const handleSaveAllRates = async () => {
    setStatusMsg("Saving all rates to store...");
    try {
      const updatedProducts = products.map((p) => ({
        ...p,
        variants: p.variants.map((v) => {
          const rawP = priceDrafts[v.id] ?? String(v.price);
          const rawM = mrpDrafts[v.id] ?? String(v.mrp);
          const rawS = stockDrafts[v.id] ?? String(v.stock);
          const pNum = Number(rawP);
          const mNum = Number(rawM);
          const sNum = Number(rawS);
          const price = Number.isFinite(pNum) && pNum > 0 ? pNum : v.price;
          const mrp = Number.isFinite(mNum) && mNum >= price ? mNum : Math.round(price * 1.25);
          const stock = Number.isFinite(sNum) && sNum >= 0 ? sNum : v.stock;
          return { ...v, price, mrp, stock };
        }),
      }));

      const res = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: updatedProducts }),
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
        setStatusMsg("✓ All rates & prices saved successfully!");
      } else {
        const err = await res.json();
        setStatusMsg(err.error || "Failed to save rates.");
      }
    } catch {
      setStatusMsg("Failed to save rates due to network error.");
    }
  };

  const handleSaveSingleVariantRate = async (product: Product, variantId: string) => {
    const rawP = priceDrafts[variantId];
    const rawM = mrpDrafts[variantId];
    const rawS = stockDrafts[variantId];
    const pNum = Number(rawP);
    const mNum = Number(rawM);
    const sNum = Number(rawS);

    const updatedVariants = product.variants.map((v) => {
      if (v.id !== variantId) return v;
      const price = Number.isFinite(pNum) && pNum > 0 ? pNum : v.price;
      const mrp = Number.isFinite(mNum) && mNum >= price ? mNum : Math.round(price * 1.25);
      const stock = Number.isFinite(sNum) && sNum >= 0 ? sNum : v.stock;
      return { ...v, price, mrp, stock };
    });

    const updatedProduct = { ...product, variants: updatedVariants };
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedProduct),
    });
    if (res.ok) {
      const data = await res.json();
      setProducts(data.products);
      setStatusMsg(`✓ Saved rate for ${product.name} (${product.variants.find(v => v.id === variantId)?.label})`);
    }
  };

  const handleAutoMrpAll = (multiplier = 1.25) => {
    const nextMrp = { ...mrpDrafts };
    for (const p of products) {
      for (const v of p.variants) {
        const pNum = Number(priceDrafts[v.id] ?? v.price);
        if (Number.isFinite(pNum) && pNum > 0) {
          nextMrp[v.id] = String(Math.round(pNum * multiplier));
        }
      }
    }
    setMrpDrafts(nextMrp);
    setStatusMsg(`Calculated +${Math.round((multiplier - 1) * 100)}% MRP for all items. Click "Save All Rates" to persist.`);
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatusMsg("Uploading CSV...");
    try {
      const csvText = await file.text();
      const res = await fetch("/api/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText, mode: csvMode }),
      });
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products);
        setStatusMsg(
          `Imported ${data.importedCount} CSV row(s)! Store now has ${data.totalProducts} products.`
        );
      } else {
        setStatusMsg(data.error || "CSV import failed.");
      }
    } catch {
      setStatusMsg("Could not read CSV file. Make sure it is saved as .csv (UTF-8).");
    }
    e.target.value = "";
  };

  const handleImageUpload = async (
    files: FileList | null,
    productId?: string
  ) => {
    if (!files || files.length === 0) return;
    setStatusMsg(`Uploading ${files.length} image(s)...`);
    const formData = new FormData();
    for (const f of Array.from(files)) {
      formData.append("files", f);
    }
    if (productId) {
      formData.append("productId", productId);
    }
    try {
      const res = await fetch("/api/images/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products);
        setStatusMsg(`Uploaded ${data.uploadedCount} product image(s) successfully!`);
      } else {
        setStatusMsg(data.error || "Image upload failed.");
      }
    } catch {
      setStatusMsg("Image upload failed due to network error.");
    }
  };

  const handleExportCsv = () => {
    const header = "Category,Product Name,Pack Size,Price,MRP,Stock,SKU,Description,Image";
    const rows = products.flatMap((p) =>
      p.variants.map((v) => {
        const esc = (s: string) => `"${String(s || "").replace(/"/g, '""')}"`;
        return [
          esc(p.categoryName),
          esc(p.name),
          esc(v.label),
          v.price,
          v.mrp,
          v.stock,
          esc(v.sku),
          esc(p.description),
          esc((v.image || p.image).replace(/^\//, "")),
        ].join(",");
      })
    );
    const blob = new Blob([[header, ...rows].join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "evoka-catalog-export.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const upiReviewCount = useMemo(
    () => orders.filter((o) => o.paymentMethod === "upi" && o.paymentStatus === "PAYMENT_UNDER_REVIEW").length,
    [orders]
  );
  const codPendingCount = useMemo(
    () =>
      orders.filter(
        (o) =>
          o.paymentMethod !== "upi" &&
          (o.status === "PENDING_CONFIRMATION" || o.status === "Pending")
      ).length,
    [orders]
  );

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return orders.filter((o) => {
      if (orderPaymentView === "upi" && o.paymentMethod !== "upi") return false;
      if (orderPaymentView === "cod" && o.paymentMethod === "upi") return false;
      if (orderFilter !== "All" && o.status !== orderFilter) return false;
      if (!q) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.phone.toLowerCase().includes(q) ||
        (o.upiReference || "").toLowerCase().includes(q)
      );
    });
  }, [orders, orderPaymentView, orderFilter, orderSearch]);

  const filteredProducts = useMemo(() => {
    const q = productSearch.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.categoryName.toLowerCase().includes(q) ||
        p.variants.some((v) => v.sku.toLowerCase().includes(q) || v.label.toLowerCase().includes(q))
    );
  }, [products, productSearch]);

  const rateRows = useMemo(() => {
    const q = rateSearch.trim().toLowerCase();
    const rows: Array<{ product: Product; variant: ProductVariant; index: number }> = [];
    let idx = 1;
    for (const p of products) {
      if (rateCategory !== "all" && p.category !== rateCategory) continue;
      for (const v of p.variants) {
        const matchesQuery =
          !q ||
          p.name.toLowerCase().includes(q) ||
          p.categoryName.toLowerCase().includes(q) ||
          v.label.toLowerCase().includes(q) ||
          v.sku.toLowerCase().includes(q);
        if (matchesQuery) {
          rows.push({ product: p, variant: v, index: idx++ });
        }
      }
    }
    return rows;
  }, [products, rateCategory, rateSearch]);

  if (checkingSession) {
    return <div className="p-16 text-center text-sm text-muted">Checking admin session...</div>;
  }

  if (!unlocked) {
    return (
      <div className="max-w-md mx-auto px-4 py-20">
        <form
          onSubmit={handleLogin}
          className="bg-white rounded-3xl border border-sand p-8 space-y-5 shadow-sm"
        >
          <div className="w-12 h-12 rounded-full bg-sage-light text-sage flex items-center justify-center mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="text-center">
            <h1 className="font-serif-brand text-2xl font-semibold text-charcoal">
              EVOKA Owner Console
            </h1>
            <p className="text-xs text-muted mt-1">
              Protected by httpOnly session cookies &amp; rate limiting.
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted mb-1">Admin PIN</label>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter Admin PIN"
              className="w-full px-4 py-2.5 rounded-xl bg-cream border border-sand text-sm"
            />
          </div>
          {authError && <p className="text-xs text-crimson font-medium">{authError}</p>}
          <button
            type="submit"
            className="w-full py-3 rounded-full bg-sage text-cream font-semibold text-sm hover:bg-sage-dark cursor-pointer"
          >
            Sign In Securely
          </button>
        </form>
      </div>
    );
  }

  const activeRevenue = orders
    .filter((o) => o.status !== "Cancelled")
    .reduce((sum, o) => sum + o.total, 0);
  const pendingCount = orders.filter((o) => o.status === "Pending").length;
  const totalVariants = products.reduce((sum, p) => sum + p.variants.length, 0);
  const lowStockCount = products.filter((p) => p.variants.some((v) => v.stock < 15)).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif-brand text-3xl font-semibold text-charcoal">
            EVOKA Owner Fulfillment &amp; Inventory
          </h1>
          <p className="text-sm text-muted">
            {BRAND.email} • Pallichal &amp; Poovar Uchakkada Outlets
          </p>
        </div>
        <div className="flex items-center gap-3">
          {statusMsg && (
            <span className="px-4 py-2 rounded-full bg-sage-light text-sage text-xs font-semibold">
              {statusMsg}
            </span>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2 rounded-full border border-sand bg-white text-xs font-semibold text-charcoal inline-flex items-center gap-1.5 hover:border-crimson hover:text-crimson cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> Lock Admin
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-sand p-5">
          <p className="text-xs text-muted uppercase font-semibold">Active Orders</p>
          <p className="text-3xl font-bold text-charcoal mt-1">{orders.length}</p>
          <p className="text-xs text-clay mt-1">{pendingCount} awaiting confirmation</p>
        </div>
        <div className="bg-white rounded-2xl border border-sand p-5">
          <p className="text-xs text-muted uppercase font-semibold">Net Sales</p>
          <p className="text-3xl font-bold text-charcoal mt-1">₹{activeRevenue}</p>
          <p className="text-xs text-sage mt-1">Excludes cancelled orders</p>
        </div>
        <div className="bg-white rounded-2xl border border-sand p-5">
          <p className="text-xs text-muted uppercase font-semibold">Catalog SKUs</p>
          <p className="text-3xl font-bold text-charcoal mt-1">{totalVariants}</p>
          <p className="text-xs text-muted mt-1">Across {products.length} product families</p>
        </div>
        <div className="bg-white rounded-2xl border border-sand p-5">
          <p className="text-xs text-muted uppercase font-semibold flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-clay" /> Low Stock
          </p>
          <p className="text-3xl font-bold text-charcoal mt-1">{lowStockCount}</p>
          <p className="text-xs text-muted mt-1">Below 15 units</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-sand pb-3">
        <button
          type="button"
          onClick={() => setTab("rates")}
          className={`px-5 py-2 rounded-full text-sm font-semibold inline-flex items-center gap-2 cursor-pointer ${
            tab === "rates" ? "bg-sage text-cream" : "bg-white border border-sand text-charcoal"
          }`}
        >
          <Tag className="w-4 h-4 text-champagne" /> Fast Rate Manager ({totalVariants})
        </button>
        <button
          type="button"
          onClick={() => setTab("orders")}
          className={`px-5 py-2 rounded-full text-sm font-semibold inline-flex items-center gap-2 cursor-pointer ${
            tab === "orders" ? "bg-sage text-cream" : "bg-white border border-sand text-charcoal"
          }`}
        >
          <ShoppingBag className="w-4 h-4" /> Order Fulfillment ({orders.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("products")}
          className={`px-5 py-2 rounded-full text-sm font-semibold inline-flex items-center gap-2 cursor-pointer ${
            tab === "products" ? "bg-sage text-cream" : "bg-white border border-sand text-charcoal"
          }`}
        >
          <Package className="w-4 h-4" /> Products &amp; Catalog ({products.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("bulk")}
          className={`px-5 py-2 rounded-full text-sm font-semibold inline-flex items-center gap-2 cursor-pointer ${
            tab === "bulk" ? "bg-sage text-cream" : "bg-white border border-sand text-charcoal"
          }`}
        >
          <Upload className="w-4 h-4" /> Bulk CSV &amp; Photo Upload
        </button>
      </div>

      {/* Tab: Fast Rate Manager */}
      {tab === "rates" && (
        <div className="space-y-5">
          {/* Action Bar */}
          <div className="bg-white rounded-3xl border border-sand p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sage bg-mint-light px-3 py-1 rounded-full mb-1">
                <Tag className="w-3.5 h-3.5 text-sage" /> Fast Rate Manager
              </span>
              <h2 className="font-editorial text-2xl font-bold text-charcoal">
                Catalog Rates &amp; Selling Prices ({totalVariants} Variants)
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Quickly edit Selling Price (₹), MRP (₹), and Stock for each product. Click &quot;Save All Rates&quot; when finished.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => handleAutoMrpAll(1.25)}
                className="px-4 py-2.5 rounded-full bg-oat border border-sand text-charcoal text-xs font-bold hover:border-sage cursor-pointer"
                title="Sets MRP to Price + 25% for items missing an MRP"
              >
                Auto MRP (+25%)
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                className="px-4 py-2.5 rounded-full bg-oat border border-sand text-charcoal text-xs font-bold inline-flex items-center gap-1.5 hover:border-sage cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-sage" />
                <span>Export Rates</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAllRates}
                className="px-6 py-2.5 rounded-full bg-sage hover:bg-sage-dark text-cream text-xs font-extrabold inline-flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer active:scale-95"
              >
                <Save className="w-4 h-4 text-champagne" />
                <span>SAVE ALL RATES (1-CLICK)</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Category Pills */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setRateCategory("all")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border cursor-pointer ${
                  rateCategory === "all"
                    ? "bg-charcoal text-cream border-charcoal"
                    : "bg-white text-charcoal border-sand"
                }`}
              >
                All Categories ({totalVariants})
              </button>
              {BRAND.categories.map((c) => {
                const count = products
                  .filter((p) => p.category === c.slug)
                  .reduce((sum, p) => sum + p.variants.length, 0);
                if (count === 0 && rateCategory !== c.slug) return null;
                return (
                  <button
                    key={c.slug}
                    type="button"
                    onClick={() => setRateCategory(c.slug)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border cursor-pointer ${
                      rateCategory === c.slug
                        ? "bg-charcoal text-cream border-charcoal"
                        : "bg-white text-charcoal border-sand"
                    }`}
                  >
                    {c.name} ({count})
                  </button>
                );
              })}
            </div>

            {/* Search */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
              <input
                type="search"
                value={rateSearch}
                onChange={(e) => setRateSearch(e.target.value)}
                placeholder="Search variant name or SKU..."
                className="w-full pl-9 pr-3 py-2 rounded-full bg-white border border-sand text-xs"
              />
            </div>
          </div>

          {/* Rates Table */}
          <div className="bg-white rounded-3xl border border-sand overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-oat/70 text-charcoal border-b border-sand uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">Product &amp; Image</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Pack Size</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4 w-28">Selling Price (₹)</th>
                    <th className="py-3 px-4 w-28">MRP (₹)</th>
                    <th className="py-3 px-4 w-24">Stock</th>
                    <th className="py-3 px-4 text-center w-28">Save Row</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand">
                  {rateRows.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-muted">
                        No products match your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    rateRows.map(({ product, variant, index }) => {
                      const curPrice = Number(priceDrafts[variant.id] ?? variant.price);
                      const curMrp = Number(mrpDrafts[variant.id] ?? variant.mrp);
                      const discount =
                        curMrp > curPrice ? Math.round(((curMrp - curPrice) / curMrp) * 100) : 0;
                      const hasChanged =
                        priceDrafts[variant.id] !== undefined &&
                        (priceDrafts[variant.id] !== String(variant.price) ||
                          mrpDrafts[variant.id] !== String(variant.mrp) ||
                          stockDrafts[variant.id] !== String(variant.stock));

                      return (
                        <tr
                          key={variant.id}
                          className={`hover:bg-oat/40 transition-colors ${
                            hasChanged ? "bg-mint-light/40" : ""
                          }`}
                        >
                          <td className="py-3 px-4 text-center text-muted font-mono">{index}</td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <SafeImage
                                src={variant.image || product.image}
                                fallbackSrc={getCategoryFallbackImage(product.category)}
                                alt={product.name}
                                className="w-10 h-10 rounded-xl object-contain bg-[#F6F7F4] p-1 border border-sand shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="font-bold text-charcoal truncate max-w-xs">{product.name}</p>
                                <p className="text-[10px] text-muted truncate">{product.scent}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium text-muted">{product.categoryName}</td>
                          <td className="py-3 px-4 font-bold text-charcoal">{variant.label}</td>
                          <td className="py-3 px-4 font-mono text-[10px] text-muted">{variant.sku}</td>
                          <td className="py-3 px-4">
                            <div className="relative">
                              <span className="absolute left-2.5 top-2 text-muted font-bold text-xs">₹</span>
                              <input
                                type="number"
                                min={0}
                                value={priceDrafts[variant.id] ?? String(variant.price)}
                                onChange={(e) =>
                                  setPriceDrafts((prev) => ({ ...prev, [variant.id]: e.target.value }))
                                }
                                onFocus={(e) => e.target.select()}
                                className="w-24 pl-6 pr-2 py-1.5 rounded-xl bg-cream border border-sand focus:border-sage focus:outline-none font-bold text-xs text-charcoal"
                              />
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="relative">
                              <span className="absolute left-2.5 top-2 text-muted font-bold text-xs">₹</span>
                              <input
                                type="number"
                                min={0}
                                value={mrpDrafts[variant.id] ?? String(variant.mrp)}
                                onChange={(e) =>
                                  setMrpDrafts((prev) => ({ ...prev, [variant.id]: e.target.value }))
                                }
                                onFocus={(e) => e.target.select()}
                                className="w-24 pl-6 pr-2 py-1.5 rounded-xl bg-cream border border-sand focus:border-sage focus:outline-none font-bold text-xs text-muted"
                              />
                            </div>
                            {discount > 0 && (
                              <span className="text-[9px] font-bold text-sage ml-1">
                                {discount}% off
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="number"
                              min={0}
                              value={stockDrafts[variant.id] ?? String(variant.stock)}
                              onChange={(e) =>
                                setStockDrafts((prev) => ({ ...prev, [variant.id]: e.target.value }))
                              }
                              className="w-16 px-2 py-1.5 rounded-xl bg-cream border border-sand focus:border-sage focus:outline-none font-bold text-xs text-charcoal"
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => handleSaveSingleVariantRate(product, variant.id)}
                              className="px-3 py-1 rounded-xl bg-oat border border-sand text-charcoal text-[11px] font-semibold hover:bg-sage hover:text-cream cursor-pointer transition-colors"
                            >
                              Save
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom sticky save bar */}
            <div className="p-4 bg-oat/50 border-t border-sand flex items-center justify-between">
              <span className="text-xs text-muted">
                Showing {rateRows.length} of {totalVariants} product variants
              </span>
              <button
                type="button"
                onClick={handleSaveAllRates}
                className="px-6 py-2.5 rounded-full bg-sage hover:bg-sage-dark text-cream text-xs font-bold inline-flex items-center gap-2 cursor-pointer shadow-sm"
              >
                <Save className="w-4 h-4 text-champagne" />
                <span>Save All Rates</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 1: Orders Fulfillment */}
      {tab === "orders" && (
        <div className="space-y-4">
          {/* Separate UPI vs COD Views */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setOrderPaymentView("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer transition-colors ${
                orderPaymentView === "all"
                  ? "bg-[#184D3B] text-white border-[#184D3B]"
                  : "bg-white text-charcoal border-sand"
              }`}
            >
              All Orders ({orders.length})
            </button>
            <button
              type="button"
              onClick={() => setOrderPaymentView("upi")}
              className={`px-4 py-2 rounded-xl text-xs font-bold border inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                orderPaymentView === "upi"
                  ? "bg-[#184D3B] text-white border-[#184D3B]"
                  : "bg-white text-charcoal border-sand"
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>UPI Prepaid Orders</span>
              {upiReviewCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px]">
                  {upiReviewCount} review
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setOrderPaymentView("cod")}
              className={`px-4 py-2 rounded-xl text-xs font-bold border inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                orderPaymentView === "cod"
                  ? "bg-[#184D3B] text-white border-[#184D3B]"
                  : "bg-white text-charcoal border-sand"
              }`}
            >
              <Banknote className="w-3.5 h-3.5" />
              <span>Cash on Delivery (COD)</span>
              {codPendingCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px]">
                  {codPendingCount} pending
                </span>
              )}
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-1.5">
              {(["All", ...ORDER_STATUSES] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setOrderFilter(st)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border cursor-pointer ${
                    orderFilter === st
                      ? "bg-charcoal text-cream border-charcoal"
                      : "bg-white text-charcoal border-sand"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
              <input
                type="search"
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search ID, name, phone, UPI ref..."
                className="w-full pl-9 pr-3 py-2 rounded-full bg-white border border-sand text-xs"
              />
            </div>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-sand p-10 text-center text-sm text-muted">
              No matching orders yet.
            </div>
          ) : (
            filteredOrders.map((order) => {
              const draft = trackingDrafts[order.id] || { courierName: "", trackingNumber: "" };
              const invoiceCheck = checkInvoiceEligibility(order);
              const isUpi = order.paymentMethod === "upi";
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-sand p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-base text-charcoal">{order.id}</span>
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-oat text-charcoal font-bold">
                          {isUpi ? "UPI PREPAID" : order.paymentMethod.toUpperCase()}
                        </span>
                        <span
                          className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                            order.paymentStatus === "PAID" || order.paymentStatus === "Paid"
                              ? "bg-emerald-100 text-emerald-800"
                              : order.paymentStatus === "REJECTED"
                              ? "bg-red-100 text-red-700"
                              : order.paymentStatus === "PAYMENT_UNDER_REVIEW"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-slate-100 text-slate-700"
                          }`}
                        >
                          Payment: {order.paymentStatus}
                        </span>
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#E8F3EE] text-[#184D3B] font-bold">
                          Fulfillment: {order.status}
                        </span>
                        <span className="text-xs text-muted">
                          {new Date(order.createdAt).toLocaleString("en-IN")}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-charcoal">
                        {order.customerName} — {order.phone}
                      </p>
                      <p className="text-xs text-muted">
                        {order.fulfillmentType === "pickup"
                          ? `Store Pickup: ${order.pickupOutlet}`
                          : `Deliver To: ${order.address.line1}, ${order.address.city}, ${order.address.state} - ${order.address.pincode}`}
                      </p>
                      {order.upiReference && (
                        <p className="text-xs font-mono font-bold text-[#184D3B]">
                          UPI Ref / UTR: {order.upiReference}
                        </p>
                      )}
                      {order.paymentRejectedReason && (
                        <p className="text-xs text-red-600 font-semibold">
                          Rejection Note: {order.paymentRejectedReason}
                        </p>
                      )}
                      {order.notes && (
                        <p className="text-xs text-clay font-medium">Customer Note: {order.notes}</p>
                      )}
                      <p className="text-xs text-sage font-medium pt-0.5">
                        {order.items
                          .map((i) => `${i.name} (${i.variantLabel}) ×${i.quantity}`)
                          .join(" | ")}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right">
                        <p className="text-[11px] text-muted uppercase">Order Total</p>
                        <p className="text-xl font-bold text-charcoal">₹{order.total}</p>
                      </div>
                      {order.paymentScreenshot && (
                        <button
                          type="button"
                          onClick={() => setPreviewScreenshotUrl(order.paymentScreenshot!)}
                          className="px-3 py-1.5 rounded-lg border border-sand bg-oat hover:bg-sand text-xs font-semibold text-charcoal inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> View Payment Screenshot
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Manual Payment Verification / COD Confirmation Bar */}
                  {(isUpi && order.paymentStatus === "PAYMENT_UNDER_REVIEW") ||
                  (!isUpi &&
                    (order.status === "PENDING_CONFIRMATION" || order.status === "Pending")) ? (
                    <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs text-amber-900">
                        {isUpi ? (
                          <span>
                            <strong>Manual Verification Required:</strong> Check UPI Ref{" "}
                            <code className="font-mono font-bold">{order.upiReference}</code> against
                            actual received bank/UPI funds before marking Paid. Screenshots are not
                            proof.
                          </span>
                        ) : (
                          <span>
                            <strong>COD Confirmation:</strong> Confirm order details with customer
                            before packing &amp; dispatching.
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {isUpi ? (
                          <>
                            <button
                              type="button"
                              onClick={() =>
                                updateOrder(order.id, { adminAction: "verify_payment" })
                              }
                              className="px-3.5 py-2 rounded-lg bg-[#184D3B] hover:bg-[#12382B] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" /> Verify Payment (Mark Paid)
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                const reason = window.prompt(
                                  "Reason for rejecting UPI payment:",
                                  "Funds not received in merchant account"
                                );
                                if (reason !== null) {
                                  updateOrder(order.id, {
                                    adminAction: "reject_payment",
                                    reason,
                                  });
                                }
                              }}
                              className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject Payment
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => updateOrder(order.id, { adminAction: "confirm_cod" })}
                            className="px-3.5 py-2 rounded-lg bg-[#184D3B] hover:bg-[#12382B] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Confirm COD Order
                          </button>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {/* Automated A4 PDF Invoice Bar */}
                  <div className="p-3.5 rounded-xl bg-[#F9FAF8] border border-sand flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs">
                      <FileText className="w-4 h-4 text-[#184D3B]" />
                      {order.invoice ? (
                        <span className="font-semibold text-charcoal">
                          Invoice <strong className="text-[#184D3B]">{order.invoice.invoiceNumber}</strong>{" "}
                          <span className="text-muted">
                            (Generated {new Date(order.invoice.generatedAt).toLocaleDateString("en-IN")})
                          </span>
                        </span>
                      ) : invoiceCheck.eligible ? (
                        <span className="text-charcoal font-medium">
                          Order eligible for A4 PDF Invoice
                        </span>
                      ) : (
                        <span className="text-muted">{invoiceCheck.reason}</span>
                      )}
                    </div>

                    {invoiceCheck.eligible && (
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          disabled={generatingInvoiceId === order.id}
                          onClick={() => handleGenerateInvoice(order.id)}
                          className="px-3 py-1.5 rounded-lg bg-white border border-sand hover:border-[#184D3B] text-xs font-semibold text-charcoal inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        >
                          <FileText className="w-3.5 h-3.5 text-[#184D3B]" />
                          <span>
                            {generatingInvoiceId === order.id
                              ? "Generating..."
                              : order.invoice
                              ? "Regenerate PDF"
                              : "Generate Invoice PDF"}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={async () => {
                            const updated = order.invoice
                              ? order
                              : await handleGenerateInvoice(order.id);
                            if (updated) setPreviewInvoiceOrder(updated);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-white border border-sand hover:border-[#184D3B] text-xs font-semibold text-charcoal inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Preview Invoice
                        </button>

                        <a
                          href={`/api/orders/${encodeURIComponent(order.id)}/invoice?download=1`}
                          onClick={async (e) => {
                            if (!order.invoice) {
                              e.preventDefault();
                              const updated = await handleGenerateInvoice(order.id);
                              if (updated) {
                                window.location.href = `/api/orders/${encodeURIComponent(
                                  order.id
                                )}/invoice?download=1`;
                              }
                            }
                          }}
                          className="px-3 py-1.5 rounded-lg bg-[#184D3B] hover:bg-[#12382B] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" /> Download PDF
                        </a>

                        <button
                          type="button"
                          onClick={() => handlePrintInvoicePdf(order)}
                          className="px-3 py-1.5 rounded-lg bg-oat hover:bg-sand border border-sand text-xs font-semibold text-charcoal inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" /> Print Invoice
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Fulfillment Controls */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-3 border-t border-sand items-center">
                    <div>
                      <label className="block text-[10px] font-semibold uppercase text-muted mb-1">
                        Order Status
                      </label>
                      <select
                        value={order.status}
                        onChange={(e) =>
                          updateOrder(order.id, { status: e.target.value as OrderStatus })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-oat border border-sand text-xs font-semibold text-charcoal cursor-pointer"
                      >
                        {ORDER_STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase text-muted mb-1">
                        Payment Status
                      </label>
                      <select
                        value={order.paymentStatus}
                        onChange={(e) =>
                          updateOrder(order.id, {
                            paymentStatus: e.target.value as PaymentStatus,
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-oat border border-sand text-xs font-semibold text-charcoal cursor-pointer"
                      >
                        {PAYMENT_STATUSES.map((ps) => (
                          <option key={ps} value={ps}>
                            {ps}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase text-muted mb-1">
                        Courier / Delivery Boy
                      </label>
                      <input
                        type="text"
                        value={draft.courierName}
                        onChange={(e) =>
                          setTrackingDrafts((prev) => ({
                            ...prev,
                            [order.id]: { ...draft, courierName: e.target.value },
                          }))
                        }
                        placeholder="DTDC / India Post / Local"
                        className="w-full px-3 py-2 rounded-xl bg-cream border border-sand text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold uppercase text-muted mb-1">
                        Tracking ID
                      </label>
                      <input
                        type="text"
                        value={draft.trackingNumber}
                        onChange={(e) =>
                          setTrackingDrafts((prev) => ({
                            ...prev,
                            [order.id]: { ...draft, trackingNumber: e.target.value },
                          }))
                        }
                        placeholder="AWB / Tracking No."
                        className="w-full px-3 py-2 rounded-xl bg-cream border border-sand text-xs"
                      />
                    </div>

                    <div className="flex items-end h-full">
                      <button
                        type="button"
                        onClick={() =>
                          updateOrder(order.id, {
                            courierName: draft.courierName,
                            trackingNumber: draft.trackingNumber,
                          })
                        }
                        className="w-full py-2 px-3 rounded-xl bg-sage text-cream text-xs font-semibold inline-flex items-center justify-center gap-1 hover:bg-sage-dark cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" /> Save Tracking
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Tab 2: Products */}
      {tab === "products" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <form
            onSubmit={handleAddProduct}
            className="lg:col-span-4 bg-white rounded-2xl border border-sand p-6 space-y-3"
          >
            <h2 className="font-semibold text-charcoal flex items-center gap-2">
              <Plus className="w-4 h-4 text-sage" /> Add New Product
            </h2>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Product Name"
              className="w-full px-3 py-2 rounded-xl bg-cream border border-sand text-sm"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CategorySlug)}
              className="w-full px-3 py-2 rounded-xl bg-cream border border-sand text-sm"
            >
              {BRAND.categories.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="Short benefit tagline"
              className="w-full px-3 py-2 rounded-xl bg-cream border border-sand text-sm"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={variantLabel}
                onChange={(e) => setVariantLabel(e.target.value)}
                placeholder="Size (e.g. 1 L)"
                className="px-3 py-2 rounded-xl bg-cream border border-sand text-sm"
              />
              <input
                type="text"
                value={scent}
                onChange={(e) => setScent(e.target.value)}
                placeholder="Scent"
                className="px-3 py-2 rounded-xl bg-cream border border-sand text-sm"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                required
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Price ₹"
                className="px-3 py-2 rounded-xl bg-cream border border-sand text-sm"
              />
              <input
                required
                type="number"
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
                placeholder="MRP ₹"
                className="px-3 py-2 rounded-xl bg-cream border border-sand text-sm"
              />
              <input
                required
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="Stock"
                className="px-3 py-2 rounded-xl bg-cream border border-sand text-sm"
              />
            </div>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="SKU (optional)"
              className="w-full px-3 py-2 rounded-xl bg-cream border border-sand text-sm"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-full bg-sage text-cream text-sm font-semibold hover:bg-sage-dark cursor-pointer"
            >
              Save Product
            </button>
          </form>

          <div className="lg:col-span-8 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-muted absolute left-3.5 top-3" />
              <input
                type="search"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                placeholder="Search products to edit price, stock, or upload photo..."
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white border border-sand text-sm"
              />
            </div>

            {filteredProducts.map((p) => (
              <div key={p.id} className="bg-white rounded-2xl border border-sand p-4 space-y-3">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <SafeImage
                      src={p.image}
                      fallbackSrc={getCategoryFallbackImage(p.category)}
                      alt={p.name}
                      className="w-12 h-12 rounded-xl object-contain bg-[#F6F7F4] p-1 border border-sand shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-charcoal truncate">{p.name}</p>
                      <p className="text-xs text-muted">{p.categoryName}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <label className="px-3 py-1.5 rounded-full bg-oat border border-sand text-xs font-semibold text-charcoal inline-flex items-center gap-1 hover:border-sage cursor-pointer">
                      <ImagePlus className="w-3.5 h-3.5 text-sage" />
                      <span>Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e.target.files, p.id)}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-2 text-muted hover:text-crimson cursor-pointer"
                      title="Delete product"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {p.variants.map((v, vIdx) => (
                    <div
                      key={v.id}
                      className="flex flex-wrap items-center gap-2 px-3 py-1.5 rounded-xl bg-oat text-xs"
                    >
                      <span className="font-semibold text-charcoal">{v.label}</span>
                      <span className="text-muted">₹</span>
                      <input
                        type="number"
                        value={priceDrafts[v.id] ?? String(v.price)}
                        onChange={(e) =>
                          setPriceDrafts((prev) => ({ ...prev, [v.id]: e.target.value }))
                        }
                        className="w-16 px-2 py-0.5 rounded bg-white border border-sand text-xs font-semibold"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleVariantUpdate(p, vIdx, {
                            price: Number(priceDrafts[v.id] ?? v.price),
                          })
                        }
                        className="px-2 py-0.5 rounded bg-sage text-cream font-semibold cursor-pointer"
                      >
                        Set ₹
                      </button>
                      <span className="text-muted">• Stock:</span>
                      <button
                        type="button"
                        onClick={() => handleVariantUpdate(p, vIdx, { stock: v.stock - 5 })}
                        className="px-1.5 py-0.5 rounded bg-white border border-sand hover:border-sage cursor-pointer"
                      >
                        -5
                      </button>
                      <strong className={v.stock < 15 ? "text-crimson" : "text-sage"}>
                        {v.stock}
                      </strong>
                      <button
                        type="button"
                        onClick={() => handleVariantUpdate(p, vIdx, { stock: v.stock + 10 })}
                        className="px-1.5 py-0.5 rounded bg-white border border-sand hover:border-sage cursor-pointer"
                      >
                        +10
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Bulk CSV & Photo Upload */}
      {tab === "bulk" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-3xl border border-sand p-8 space-y-5">
            <h2 className="font-serif-brand text-2xl font-semibold text-charcoal">
              1. Bulk Product CSV Upload
            </h2>
            <p className="text-sm text-muted leading-relaxed">
              Supports your exact spreadsheet columns (
              <code>Category, Product Name, Pack Size, Description, Image</code>) as well as{" "}
              <code>Price, MRP, Stock, SKU</code>. You can export your current catalog below, edit
              prices in Excel, and re-upload!
            </p>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="csvMode"
                  checked={csvMode === "merge"}
                  onChange={() => setCsvMode("merge")}
                />
                <span>Merge / Update Existing</span>
              </label>
              <label className="inline-flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="csvMode"
                  checked={csvMode === "replace"}
                  onChange={() => setCsvMode("replace")}
                />
                <span>Replace Entire Catalog</span>
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleExportCsv}
                className="px-5 py-3 rounded-full bg-oat border border-sand text-charcoal text-sm font-semibold inline-flex items-center gap-2 hover:border-sage cursor-pointer"
              >
                <Download className="w-4 h-4 text-sage" />
                <span>Export Current Catalog CSV</span>
              </button>

              <label className="px-5 py-3 rounded-full bg-sage text-cream text-sm font-semibold inline-flex items-center gap-2 hover:bg-sage-dark cursor-pointer">
                <Upload className="w-4 h-4" />
                <span>Upload Filled CSV</span>
                <input type="file" accept=".csv,text/csv" onChange={handleCsvUpload} className="hidden" />
              </label>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-sand p-8 space-y-5">
            <h2 className="font-serif-brand text-2xl font-semibold text-charcoal">
              2. Bulk Product Photos Upload
            </h2>
            <p className="text-sm text-muted leading-relaxed">
              Your CSV already lists filenames like{" "}
              <code>detergent-matic-royal-rose-1l.jpg</code> or{" "}
              <code>dishwash-lemon-500ml.jpg</code>. Select as many product photos as you have on
              your computer and upload them all at once—matching products will switch to your real
              photos automatically!
            </p>

            <label className="px-6 py-4 rounded-2xl border-2 border-dashed border-sage/50 bg-sage-light/40 text-sage text-sm font-semibold flex flex-col items-center justify-center gap-2 hover:bg-sage-light cursor-pointer text-center">
              <ImagePlus className="w-7 h-7" />
              <span>Click to Select Multiple Product Photos (.jpg, .png, .webp)</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleImageUpload(e.target.files)}
                className="hidden"
              />
            </label>
          </div>
        </div>
      )}

      {/* Payment Screenshot Lightbox */}
      {previewScreenshotUrl && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 space-y-3 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-charcoal">Customer Payment Screenshot</h3>
              <button
                type="button"
                onClick={() => setPreviewScreenshotUrl(null)}
                className="p-1.5 rounded-lg hover:bg-oat cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={previewScreenshotUrl}
              alt="Customer UPI Payment Screenshot"
              className="w-full max-h-[70vh] object-contain rounded-xl bg-[#F9FAF8] border border-sand"
            />
            <p className="text-[11px] text-amber-800 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
              Always verify the UPI Transaction Reference against actual funds credited in your
              merchant bank account before clicking Verify Payment.
            </p>
          </div>
        </div>
      )}

      {/* Invoice PDF Preview Modal */}
      {previewInvoiceOrder && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full h-[88vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-5 py-3.5 border-b border-sand flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-charcoal">
                  Invoice Preview — {previewInvoiceOrder.invoice?.invoiceNumber}
                </h3>
                <p className="text-xs text-muted">Order {previewInvoiceOrder.id}</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`/api/orders/${encodeURIComponent(previewInvoiceOrder.id)}/invoice?download=1`}
                  className="px-3 py-1.5 rounded-lg bg-[#184D3B] text-white text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </a>
                <button
                  type="button"
                  onClick={() => handlePrintInvoicePdf(previewInvoiceOrder)}
                  className="px-3 py-1.5 rounded-lg bg-oat border border-sand text-xs font-semibold text-charcoal inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewInvoiceOrder(null)}
                  className="p-1.5 rounded-lg hover:bg-oat cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            <iframe
              src={`/api/orders/${encodeURIComponent(previewInvoiceOrder.id)}/invoice`}
              title={`Invoice ${previewInvoiceOrder.invoice?.invoiceNumber}`}
              className="flex-1 w-full bg-[#F4F6F4]"
            />
          </div>
        </div>
      )}
    </div>
  );
}
