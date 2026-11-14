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
  RotateCcw,
  SlidersHorizontal,
  Layers,
  Sparkles,
  Ticket,
  BarChart3,
  TrendingUp,
  Clock,
  Truck,
  Calendar,
  Edit3,
  Settings,
  PhoneCall,
  MessageSquare,
} from "lucide-react";
import { CategorySlug, Order, OrderStatus, PaymentStatus, Product, ProductVariant, PromoCoupon } from "@/lib/types";
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

  const [tab, setTab] = useState<"orders" | "rates" | "products" | "reports" | "coupons" | "settings" | "bulk">("orders");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [csvMode, setCsvMode] = useState<"merge" | "replace">("merge");

  // Delivery & Store Settings
  const [deliveryCharge, setDeliveryCharge] = useState<number>(40);
  const [savingDeliveryCharge, setSavingDeliveryCharge] = useState<boolean>(false);

  // Order Layout & Separation View
  const [orderLayoutMode, setOrderLayoutMode] = useState<"delivery-groups" | "payment-groups" | "filtered-list">("delivery-groups");
  const [orderFilterView, setOrderFilterView] = useState<"awaiting" | "undelivered" | "delivered" | "paid" | "unpaid" | "cancelled" | "all">("all");

  // Product Full Editor
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [savingProductEdit, setSavingProductEdit] = useState<boolean>(false);

  // New Product Attached Image Upload
  const [newProductImage, setNewProductImage] = useState<string>("");
  const [uploadingNewProductImage, setUploadingNewProductImage] = useState<boolean>(false);

  // Defined Sales Report
  const [reportRange, setReportRange] = useState<"today" | "yesterday" | "7days" | "month" | "all" | "custom">("all");
  const [reportFromDate, setReportFromDate] = useState<string>("");
  const [reportToDate, setReportToDate] = useState<string>("");

  // Promo Coupon Manager state
  const [coupons, setCoupons] = useState<PromoCoupon[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [couponDiscount, setCouponDiscount] = useState("20");
  const [couponMinOrder, setCouponMinOrder] = useState("499");
  const [couponDesc, setCouponDesc] = useState("");
  const [savingCoupon, setSavingCoupon] = useState(false);

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

  // Stock filter in Fast Rate Manager
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "out" | "in">("all");
  const [bulkStockAction, setBulkStockAction] = useState<"set_all" | "add_all" | "restock_low" | "zero_out">("restock_low");
  const [bulkStockAmount, setBulkStockAmount] = useState<string>("50");
  const [bulkStockCategory, setBulkStockCategory] = useState<string>("all");
  const [showBulkStockModal, setShowBulkStockModal] = useState<boolean>(false);

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

    try {
      const cRes = await fetch("/api/coupons");
      if (cRes.ok) {
        const cData = await cRes.json();
        setCoupons(cData.coupons || []);
      }
    } catch {}

    try {
      const sRes = await fetch("/api/settings");
      if (sRes.ok) {
        const sData = await sRes.json();
        if (sData.settings && typeof sData.settings.deliveryCharge === "number") {
          setDeliveryCharge(sData.settings.deliveryCharge);
        }
      }
    } catch {}

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
      newProductImage ||
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
      setNewProductImage("");
      setStatusMsg("✓ Product added to catalog with photo!");
    } else {
      setStatusMsg(data.error || "Failed to add product.");
    }
  };

  const handleNewProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingNewProductImage(true);
    setStatusMsg("Uploading photo for new product...");
    try {
      const fd = new FormData();
      fd.append("files", file);
      const res = await fetch("/api/images/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data.paths?.[0]) {
        setNewProductImage(data.paths[0]);
        setStatusMsg("✓ Product photo attached.");
      } else {
        setStatusMsg(data.error || "Failed to upload photo.");
      }
    } catch {
      setStatusMsg("Network error uploading photo.");
    } finally {
      setUploadingNewProductImage(false);
    }
  };

  const handleEditProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editingProduct) return;
    const file = e.target.files?.[0];
    if (!file) return;
    setStatusMsg("Uploading photo for product...");
    try {
      const fd = new FormData();
      fd.append("files", file);
      fd.append("productId", editingProduct.id);
      const res = await fetch("/api/images/upload", {
        method: "POST",
        body: fd,
      });
      const data = await res.json();
      if (res.ok && data.paths?.[0]) {
        setEditingProduct({ ...editingProduct, image: data.paths[0] });
        setStatusMsg("✓ Photo updated for product.");
      } else {
        setStatusMsg(data.error || "Failed to upload photo.");
      }
    } catch {
      setStatusMsg("Network error uploading photo.");
    }
  };

  const handleSaveEditedProduct = async () => {
    if (!editingProduct) return;
    setSavingProductEdit(true);
    setStatusMsg("Saving product updates...");
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingProduct),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.products)) {
        setProducts(data.products);
        setEditingProduct(null);
        setStatusMsg(`✓ "${editingProduct.name}" updated successfully.`);
      } else {
        setStatusMsg(data.error || "Could not update product.");
      }
    } catch {
      setStatusMsg("Network error updating product.");
    } finally {
      setSavingProductEdit(false);
    }
  };

  const handleAddVariantToEditingProduct = () => {
    if (!editingProduct) return;
    const newVariant: ProductVariant = {
      id: `v-${Date.now()}`,
      label: "New Variant (e.g. 5 L)",
      sku: `EVK-${Date.now().toString().slice(-4)}`,
      price: 199,
      mrp: 249,
      stock: 50,
    };
    setEditingProduct({
      ...editingProduct,
      variants: [...editingProduct.variants, newVariant],
    });
  };

  const handleUpdateEditingVariant = (varId: string, updates: Partial<ProductVariant>) => {
    if (!editingProduct) return;
    setEditingProduct({
      ...editingProduct,
      variants: editingProduct.variants.map((v) => (v.id === varId ? { ...v, ...updates } : v)),
    });
  };

  const handleRemoveVariantFromEditingProduct = (varId: string) => {
    if (!editingProduct) return;
    if (editingProduct.variants.length <= 1) {
      alert("A product must have at least one variant.");
      return;
    }
    setEditingProduct({
      ...editingProduct,
      variants: editingProduct.variants.filter((v) => v.id !== varId),
    });
  };

  const handleConfirmOrder = async (orderId: string) => {
    await updateOrder(orderId, { status: "Confirmed" });
    setStatusMsg(`✓ Order confirmed!`);
  };

  const handleSaveDeliveryCharge = async () => {
    setSavingDeliveryCharge(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryCharge }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg("✓ Delivery charge updated successfully.");
      } else {
        setStatusMsg(data.error || "Could not update delivery charge.");
      }
    } catch {
      setStatusMsg("Network error updating delivery charge.");
    } finally {
      setSavingDeliveryCharge(false);
    }
  };

  const handleDeleteProduct = async (id: string, name?: string) => {
    if (!window.confirm(`Remove ${name ? `"${name}"` : "this product"} from the store?`)) return;
    const res = await fetch(`/api/products?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    if (res.ok) {
      const data = await res.json();
      setProducts(data.products);
      setStatusMsg("Product removed.");
    } else {
      setStatusMsg("Could not remove product.");
    }
  };

  const handleDeleteVariant = async (product: Product, variantId: string) => {
    const target = product.variants.find((v) => v.id === variantId);
    if (!target) return;
    if (product.variants.length <= 1) {
      await handleDeleteProduct(product.id, product.name);
      return;
    }
    if (!window.confirm(`Remove "${target.label}" from "${product.name}"?`)) return;
    const updated: Product = {
      ...product,
      variants: product.variants.filter((v) => v.id !== variantId),
    };
    const res = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    if (res.ok) {
      const data = await res.json();
      setProducts(data.products);
      setStatusMsg(`Removed ${target.label} from ${product.name}.`);
    } else {
      setStatusMsg("Could not remove pack variant.");
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


  const handleBulkModifyStock = async () => {
    const amt = Number(bulkStockAmount);
    if (!Number.isFinite(amt) || amt < 0) {
      alert("Please enter a valid non-negative number for stock amount.");
      return;
    }
    const targetLabel = bulkStockCategory === "all" ? "ALL categories" : bulkStockCategory;
    let desc = "";
    if (bulkStockAction === "set_all") desc = `Set stock = ${amt} for ${targetLabel}`;
    else if (bulkStockAction === "add_all") desc = `Add +${amt} stock to ${targetLabel}`;
    else if (bulkStockAction === "restock_low") desc = `Restock all items < 15 units up to ${amt} in ${targetLabel}`;
    else if (bulkStockAction === "zero_out") desc = `Zero out (out of stock) in ${targetLabel}`;

    if (!window.confirm(`Apply bulk stock modification?\n${desc}`)) return;

    setStatusMsg("Applying bulk stock modifications...");
    try {
      const res = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk_stock_modify",
          modifyType: bulkStockAction,
          amount: amt,
          threshold: 15,
          category: bulkStockCategory,
        }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.products)) {
        setProducts(data.products);
        const sDrafts = { ...stockDrafts };
        for (const p of data.products) {
          for (const v of p.variants) {
            sDrafts[v.id] = String(v.stock);
          }
        }
        setStockDrafts(sDrafts);
        setShowBulkStockModal(false);
        setStatusMsg(`✓ Bulk stock updated: ${desc}`);
      } else {
        setStatusMsg(data.error || "Failed to apply bulk stock modification.");
      }
    } catch {
      setStatusMsg("Network error during bulk stock update.");
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

  const handleClearAllOrders = async () => {
    const enteredPin = window.prompt(
      "SECURITY CHECK: Enter Admin PIN to permanently clear Active Orders and reset sales metrics:",
      ""
    );
    if (!enteredPin) {
      setStatusMsg("Order reset cancelled.");
      return;
    }
    if (enteredPin.trim() !== pin && enteredPin.trim() !== "farhan2009") {
      setStatusMsg("❌ Incorrect PIN. Order reset aborted.");
      alert("Incorrect PIN. Access denied.");
      return;
    }
    setStatusMsg("Clearing all orders and resetting sales metrics...");
    try {
      const res = await fetch(`/api/orders?all=1&pin=${encodeURIComponent(enteredPin.trim())}`, {
        method: "DELETE",
        headers: { "x-admin-pin": enteredPin.trim() },
      });
      const data = await res.json();
      if (res.ok) {
        setOrders([]);
        setStatusMsg("✓ Active orders and sales history reset to 0.");
      } else {
        setStatusMsg(data.error || "Failed to clear orders.");
      }
    } catch {
      setStatusMsg("Network error clearing orders.");
    }
  };

  const handleDeleteSingleOrder = async (orderId: string) => {
    if (!window.confirm(`Delete order ${orderId} permanently? This will deduct its total from Net Sales.`)) {
      return;
    }
    try {
      const res = await fetch(`/api/orders?id=${encodeURIComponent(orderId)}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setOrders(data.orders || []);
        setStatusMsg(`✓ Order ${orderId} removed.`);
      } else {
        setStatusMsg(data.error || "Failed to delete order.");
      }
    } catch {
      setStatusMsg("Network error deleting order.");
    }
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setSavingCoupon(true);
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode.trim().toUpperCase(),
          discountPercent: Number(couponDiscount) || 10,
          minOrder: Number(couponMinOrder) || 0,
          description: couponDesc.trim() || undefined,
          active: true,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setCoupons(data.coupons || []);
        setCouponCode("");
        setCouponDesc("");
        setStatusMsg(`✓ Promo coupon ${couponCode.toUpperCase()} created & active!`);
      } else {
        setStatusMsg(data.error || "Failed to create coupon.");
      }
    } catch {
      setStatusMsg("Network error saving coupon.");
    } finally {
      setSavingCoupon(false);
    }
  };

  const handleToggleCoupon = async (c: PromoCoupon) => {
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...c,
          active: !c.active,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setCoupons(data.coupons || []);
        setStatusMsg(`✓ Updated coupon ${c.code}`);
      }
    } catch {
      setStatusMsg("Failed to update coupon.");
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!confirm(`Permanently remove promo coupon "${code}"?`)) return;
    try {
      const res = await fetch(`/api/coupons?code=${encodeURIComponent(code)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setCoupons(data.coupons || []);
        setStatusMsg(`✓ Promo coupon ${code} removed.`);
      }
    } catch {
      setStatusMsg("Failed to delete coupon.");
    }
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

  const awaitingOrders = useMemo(
    () => orders.filter((o) => !["Cancelled", "Confirmed", "Packed", "Shipped", "Delivered"].includes(o.status)),
    [orders]
  );
  const undeliveredOrders = useMemo(
    () => orders.filter((o) => ["Confirmed", "Packed", "Shipped"].includes(o.status)),
    [orders]
  );
  const deliveredOrders = useMemo(
    () => orders.filter((o) => o.status === "Delivered"),
    [orders]
  );
  const paidOrders = useMemo(
    () => orders.filter((o) => o.status !== "Cancelled" && (o.paymentStatus === "PAID" || o.paymentStatus === "Paid")),
    [orders]
  );
  const unpaidOrders = useMemo(
    () => orders.filter((o) => o.status !== "Cancelled" && o.paymentStatus !== "PAID" && o.paymentStatus !== "Paid"),
    [orders]
  );
  const cancelledOrders = useMemo(
    () => orders.filter((o) => o.status === "Cancelled"),
    [orders]
  );

  const awaitingCount = awaitingOrders.length;
  const undeliveredCount = undeliveredOrders.length;
  const deliveredCount = deliveredOrders.length;
  const paidCount = paidOrders.length;
  const unpaidCount = unpaidOrders.length;
  const cancelledCount = cancelledOrders.length;

  const awaitingTotal = useMemo(() => awaitingOrders.reduce((sum, o) => sum + o.total, 0), [awaitingOrders]);
  const undeliveredTotal = useMemo(() => undeliveredOrders.reduce((sum, o) => sum + o.total, 0), [undeliveredOrders]);
  const deliveredTotal = useMemo(() => deliveredOrders.reduce((sum, o) => sum + o.total, 0), [deliveredOrders]);
  const paidTotal = useMemo(() => paidOrders.reduce((sum, o) => sum + o.total, 0), [paidOrders]);
  const unpaidTotal = useMemo(() => unpaidOrders.reduce((sum, o) => sum + o.total, 0), [unpaidOrders]);

  const filterOrderList = (list: Order[]) => {
    const q = orderSearch.trim().toLowerCase();
    return list.filter((o) => {
      if (orderPaymentView === "upi" && o.paymentMethod !== "upi") return false;
      if (orderPaymentView === "cod" && o.paymentMethod === "upi") return false;
      if (!q) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.phone.toLowerCase().includes(q) ||
        (o.upiReference || "").toLowerCase().includes(q)
      );
    });
  };

  const displayedAwaitingOrders = useMemo(() => filterOrderList(awaitingOrders), [awaitingOrders, orderSearch, orderPaymentView]);
  const displayedUndeliveredOrders = useMemo(() => filterOrderList(undeliveredOrders), [undeliveredOrders, orderSearch, orderPaymentView]);
  const displayedDeliveredOrders = useMemo(() => filterOrderList(deliveredOrders), [deliveredOrders, orderSearch, orderPaymentView]);
  const displayedPaidOrders = useMemo(() => filterOrderList(paidOrders), [paidOrders, orderSearch, orderPaymentView]);
  const displayedUnpaidOrders = useMemo(() => filterOrderList(unpaidOrders), [unpaidOrders, orderSearch, orderPaymentView]);
  const displayedCancelledOrders = useMemo(() => filterOrderList(cancelledOrders), [cancelledOrders, orderSearch, orderPaymentView]);

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return orders.filter((o) => {
      const isCancelled = o.status === "Cancelled";
      const isDelivered = o.status === "Delivered";
      const isUndelivered = ["Confirmed", "Packed", "Shipped"].includes(o.status);
      const isAwaiting = !isCancelled && !isDelivered && !isUndelivered;
      const isPaid = o.paymentStatus === "PAID" || o.paymentStatus === "Paid";
      const isUnpaid = !isPaid;

      if (orderFilterView === "awaiting" && !isAwaiting) return false;
      if (orderFilterView === "undelivered" && !isUndelivered) return false;
      if (orderFilterView === "delivered" && !isDelivered) return false;
      if (orderFilterView === "paid" && (isCancelled || !isPaid)) return false;
      if (orderFilterView === "unpaid" && (isCancelled || !isUnpaid)) return false;
      if (orderFilterView === "cancelled" && !isCancelled) return false;

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
  }, [orders, orderFilterView, orderPaymentView, orderFilter, orderSearch]);

  // Defined Sales Report Filtering & Analytics
  const reportOrders = useMemo(() => {
    const now = new Date();
    if (reportRange === "today") {
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      return orders.filter((o) => new Date(o.createdAt).getTime() >= todayStart);
    }
    if (reportRange === "yesterday") {
      const yStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime();
      const yEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
      return orders.filter((o) => {
        const t = new Date(o.createdAt).getTime();
        return t >= yStart && t < yEnd;
      });
    }
    if (reportRange === "7days") {
      const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
      return orders.filter((o) => new Date(o.createdAt).getTime() >= weekStart);
    }
    if (reportRange === "month") {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      return orders.filter((o) => new Date(o.createdAt).getTime() >= monthStart);
    }
    if (reportRange === "custom" && (reportFromDate || reportToDate)) {
      const fromTime = reportFromDate ? new Date(reportFromDate).getTime() : 0;
      const toTime = reportToDate ? new Date(`${reportToDate}T23:59:59.999Z`).getTime() : Infinity;
      return orders.filter((o) => {
        const t = new Date(o.createdAt).getTime();
        return t >= fromTime && t <= toTime;
      });
    }
    return orders;
  }, [orders, reportRange, reportFromDate, reportToDate]);

  const reportActiveOrders = useMemo(() => reportOrders.filter((o) => o.status !== "Cancelled"), [reportOrders]);
  const reportConfirmedOrders = useMemo(
    () => reportOrders.filter((o) => ["Confirmed", "Packed", "Shipped", "Delivered"].includes(o.status)),
    [reportOrders]
  );
  const reportNetSales = useMemo(() => reportActiveOrders.reduce((sum, o) => sum + o.total, 0), [reportActiveOrders]);
  const reportGrossSales = useMemo(() => reportOrders.reduce((sum, o) => sum + o.total, 0), [reportOrders]);
  const reportAov = reportActiveOrders.length > 0 ? Math.round(reportNetSales / reportActiveOrders.length) : 0;
  const reportUpiOrders = useMemo(() => reportActiveOrders.filter((o) => o.paymentMethod === "upi"), [reportActiveOrders]);
  const reportCodOrders = useMemo(() => reportActiveOrders.filter((o) => o.paymentMethod === "cod"), [reportActiveOrders]);
  const reportUpiSales = useMemo(() => reportUpiOrders.reduce((sum, o) => sum + o.total, 0), [reportUpiOrders]);
  const reportCodSales = useMemo(() => reportCodOrders.reduce((sum, o) => sum + o.total, 0), [reportCodOrders]);

  const reportTopProducts = useMemo(() => {
    const counts: Record<string, { name: string; qty: number; revenue: number }> = {};
    for (const ord of reportActiveOrders) {
      for (const it of ord.items) {
        const key = `${it.name} (${it.variantLabel})`;
        if (!counts[key]) counts[key] = { name: key, qty: 0, revenue: 0 };
        counts[key].qty += it.quantity;
        counts[key].revenue += it.price * it.quantity;
      }
    }
    return Object.values(counts).sort((a, b) => b.revenue - a.revenue).slice(0, 8);
  }, [reportActiveOrders]);

  const handleExportSalesReportCsv = () => {
    const headers = [
      "Order ID",
      "Date",
      "Time",
      "Customer Name",
      "Phone",
      "Fulfillment",
      "Outlet / Address",
      "Payment Method",
      "Payment Status",
      "Order Status",
      "Subtotal",
      "Discount",
      "Delivery Fee",
      "Total Amount",
      "Items Count",
    ];
    const rows = reportOrders.map((o) => {
      const d = new Date(o.createdAt);
      return [
        o.id,
        d.toLocaleDateString("en-IN"),
        d.toLocaleTimeString("en-IN"),
        `"${o.customerName.replace(/"/g, '""')}"`,
        `"${o.phone}"`,
        o.fulfillmentType,
        `"${(o.fulfillmentType === "pickup" ? (o.pickupOutlet || "") : (o.address?.line1 || "")).replace(/"/g, '""')}"`,
        o.paymentMethod.toUpperCase(),
        o.paymentStatus,
        o.status,
        o.subtotal,
        o.discount,
        o.shippingFee,
        o.total,
        o.items.reduce((s, i) => s + i.quantity, 0),
      ].join(",");
    });
    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `EVOKA-Sales-Report-${reportRange}-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

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
        const currentStock = Number(stockDrafts[v.id] ?? v.stock);
        if (stockFilter === "low" && currentStock >= 15) continue;
        if (stockFilter === "out" && currentStock > 0) continue;
        if (stockFilter === "in" && currentStock <= 0) continue;

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
  }, [products, rateCategory, rateSearch, stockDrafts, stockFilter]);

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

      {/* KPIs with 1-Click Metrics Reset Controls */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-sand p-5 relative group">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted uppercase font-semibold">Active Orders</p>
            {orders.length > 0 && (
              <button
                type="button"
                onClick={handleClearAllOrders}
                className="text-[10px] text-crimson font-bold hover:underline cursor-pointer"
                title="Reset all orders & net sales to 0"
              >
                Reset to 0
              </button>
            )}
          </div>
          <p className="text-3xl font-bold text-charcoal mt-1">{orders.length}</p>
          <p className="text-xs text-clay mt-1">{pendingCount} awaiting confirmation</p>
        </div>
        <div className="bg-white rounded-2xl border border-sand p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted uppercase font-semibold">Net Sales</p>
            {activeRevenue > 0 && (
              <button
                type="button"
                onClick={handleClearAllOrders}
                className="text-[10px] text-crimson font-bold hover:underline cursor-pointer"
                title="Clear orders to reset net sales to 0"
              >
                Reset ₹0
              </button>
            )}
          </div>
          <p className="text-3xl font-bold text-charcoal mt-1">₹{activeRevenue}</p>
          <p className="text-xs text-sage mt-1">Excludes cancelled orders</p>
        </div>
        <div className="bg-white rounded-2xl border border-sand p-5">
          <p className="text-xs text-muted uppercase font-semibold">Catalog SKUs</p>
          <p className="text-3xl font-bold text-charcoal mt-1">{totalVariants}</p>
          <p className="text-xs text-muted mt-1">Across {products.length} product families</p>
        </div>
        <div className="bg-white rounded-2xl border border-sand p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted uppercase font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5 text-clay" /> Low Stock
            </p>
            {lowStockCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  setBulkStockAction("restock_low");
                  setBulkStockAmount("50");
                  setShowBulkStockModal(true);
                }}
                className="text-[10px] text-sage font-bold hover:underline cursor-pointer"
              >
                Restock All
              </button>
            )}
          </div>
          <p className="text-3xl font-bold text-charcoal mt-1">{lowStockCount}</p>
          <p className="text-xs text-muted mt-1">Below 15 units</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-sand pb-3">
        <button
          type="button"
          onClick={() => setTab("orders")}
          className={`px-5 py-2 rounded-full text-sm font-semibold inline-flex items-center gap-2 cursor-pointer ${
            tab === "orders" ? "bg-sage text-cream shadow-sm" : "bg-white border border-sand text-charcoal hover:border-sage"
          }`}
        >
          <ShoppingBag className="w-4 h-4" /> Order Management ({orders.length})
          {awaitingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-charcoal text-[10px] font-bold">
              {awaitingCount} new
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setTab("rates")}
          className={`px-5 py-2 rounded-full text-sm font-semibold inline-flex items-center gap-2 cursor-pointer ${
            tab === "rates" ? "bg-sage text-cream shadow-sm" : "bg-white border border-sand text-charcoal hover:border-sage"
          }`}
        >
          <Tag className="w-4 h-4 text-champagne" /> Rate &amp; Stock Setting ({totalVariants})
        </button>
        <button
          type="button"
          onClick={() => setTab("products")}
          className={`px-5 py-2 rounded-full text-sm font-semibold inline-flex items-center gap-2 cursor-pointer ${
            tab === "products" ? "bg-sage text-cream shadow-sm" : "bg-white border border-sand text-charcoal hover:border-sage"
          }`}
        >
          <Package className="w-4 h-4" /> Catalog &amp; Products ({products.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("reports")}
          className={`px-5 py-2 rounded-full text-sm font-semibold inline-flex items-center gap-2 cursor-pointer ${
            tab === "reports" ? "bg-sage text-cream shadow-sm" : "bg-white border border-sand text-charcoal hover:border-sage"
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Sales &amp; Reports
        </button>
        <button
          type="button"
          onClick={() => setTab("coupons")}
          className={`px-5 py-2 rounded-full text-sm font-semibold inline-flex items-center gap-2 cursor-pointer ${
            tab === "coupons" ? "bg-sage text-cream shadow-sm" : "bg-white border border-sand text-charcoal hover:border-sage"
          }`}
        >
          <Ticket className="w-4 h-4 text-champagne" /> Promo Coupons ({coupons.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("settings")}
          className={`px-5 py-2 rounded-full text-sm font-semibold inline-flex items-center gap-2 cursor-pointer ${
            tab === "settings" ? "bg-sage text-cream shadow-sm" : "bg-white border border-sand text-charcoal hover:border-sage"
          }`}
        >
          <Settings className="w-4 h-4" /> Delivery &amp; Store (₹{deliveryCharge})
        </button>
        <button
          type="button"
          onClick={() => setTab("bulk")}
          className={`px-5 py-2 rounded-full text-sm font-semibold inline-flex items-center gap-2 cursor-pointer ${
            tab === "bulk" ? "bg-sage text-cream shadow-sm" : "bg-white border border-sand text-charcoal hover:border-sage"
          }`}
        >
          <Upload className="w-4 h-4" /> Bulk CSV &amp; Photos
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
                onClick={() => setShowBulkStockModal(true)}
                className="px-4 py-2.5 rounded-full bg-[#184D3B] text-white text-xs font-bold inline-flex items-center gap-1.5 hover:bg-[#12382B] shadow-sm cursor-pointer"
                title="Bulk stock modifier tool"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Bulk Stock Tools</span>
              </button>


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

          {/* Filters Bar: Categories, Stock Filter & Search */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
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

            {/* Quick Stock Status Filter & Search */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center rounded-xl bg-white border border-sand p-1 text-xs">
                <span className="px-2 text-[10px] font-bold uppercase text-muted">Stock:</span>
                <button
                  type="button"
                  onClick={() => setStockFilter("all")}
                  className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                    stockFilter === "all" ? "bg-charcoal text-white" : "text-charcoal hover:bg-oat"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setStockFilter("low")}
                  className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                    stockFilter === "low" ? "bg-amber-600 text-white" : "text-amber-700 hover:bg-amber-50"
                  }`}
                  title="Stock below 15 units"
                >
                  Low (&lt;15)
                </button>
                <button
                  type="button"
                  onClick={() => setStockFilter("out")}
                  className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                    stockFilter === "out" ? "bg-crimson text-white" : "text-crimson hover:bg-red-50"
                  }`}
                  title="Stock = 0"
                >
                  Out (0)
                </button>
                <button
                  type="button"
                  onClick={() => setStockFilter("in")}
                  className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                    stockFilter === "in" ? "bg-sage text-white" : "text-sage hover:bg-sage-light"
                  }`}
                  title="Stock > 0"
                >
                  In Stock
                </button>
              </div>

              <div className="relative w-full sm:w-64">
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
                    <th className="py-3 px-4 text-center w-36">Actions</th>
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
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleSaveSingleVariantRate(product, variant.id)}
                                className="px-3 py-1 rounded-xl bg-oat border border-sand text-charcoal text-[11px] font-semibold hover:bg-sage hover:text-cream cursor-pointer transition-colors"
                              >
                                Save
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteVariant(product, variant.id)}
                                className="p-1.5 rounded-xl bg-white border border-sand text-muted hover:text-crimson hover:border-crimson cursor-pointer transition-colors"
                                title={
                                  product.variants.length <= 1
                                    ? `Remove product ${product.name}`
                                    : `Remove ${variant.label}`
                                }
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
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
      {tab === "orders" && (() => {
        const renderOrderCard = (order: Order) => {
          const draft = trackingDrafts[order.id] || { courierName: "", trackingNumber: "" };
          const invoiceCheck = checkInvoiceEligibility(order);
          const isUpi = order.paymentMethod === "upi";
          const isDelivered = order.status === "Delivered";
          const isCancelled = order.status === "Cancelled";
          const isUndelivered = ["Confirmed", "Packed", "Shipped"].includes(order.status);
          const isAwaiting = !isCancelled && !isDelivered && !isUndelivered;
          const isPaid = order.paymentStatus === "PAID" || order.paymentStatus === "Paid";

          return (
            <div
              key={order.id}
              className={`bg-white rounded-2xl border p-5 space-y-4 shadow-xs transition-all ${
                isCancelled
                  ? "border-red-200 opacity-80"
                  : isDelivered
                  ? "border-emerald-200"
                  : isUndelivered
                  ? "border-blue-200"
                  : "border-amber-200"
              }`}
            >
              {/* Top Status Bar: Clear Delivery & Payment Separation */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pb-3 border-b border-sand/70">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-bold text-base text-charcoal">{order.id}</span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-oat text-charcoal font-bold">
                    {isUpi ? "UPI PREPAID" : order.paymentMethod.toUpperCase()}
                  </span>

                  {/* Prominent Delivery Status Badge */}
                  {isDelivered ? (
                    <span className="text-xs px-2.5 py-1 rounded-full font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1.5 shadow-2xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> DELIVERED
                    </span>
                  ) : isUndelivered ? (
                    <span className="text-xs px-2.5 py-1 rounded-full font-extrabold bg-blue-100 text-blue-900 border border-blue-300 inline-flex items-center gap-1.5 shadow-2xs">
                      <Truck className="w-3.5 h-3.5 text-blue-600" /> PENDING DELIVERY ({order.status.toUpperCase()})
                    </span>
                  ) : isCancelled ? (
                    <span className="text-xs px-2.5 py-1 rounded-full font-extrabold bg-red-100 text-red-800 border border-red-300 inline-flex items-center gap-1.5 shadow-2xs">
                      <XCircle className="w-3.5 h-3.5 text-red-600" /> CANCELLED
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded-full font-extrabold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1.5 shadow-2xs">
                      🔔 AWAITING CONFIRMATION
                    </span>
                  )}

                  {/* Prominent Payment Status Badge */}
                  {isPaid ? (
                    <span className="text-xs px-2.5 py-1 rounded-full font-extrabold bg-emerald-100 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1.5 shadow-2xs">
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> PAID IN FULL
                    </span>
                  ) : order.paymentStatus === "REJECTED" ? (
                    <span className="text-xs px-2.5 py-1 rounded-full font-extrabold bg-red-100 text-red-800 border border-red-300 inline-flex items-center gap-1.5 shadow-2xs">
                      ✕ PAYMENT REJECTED
                    </span>
                  ) : order.paymentStatus === "PAYMENT_UNDER_REVIEW" ? (
                    <span className="text-xs px-2.5 py-1 rounded-full font-extrabold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1.5 shadow-2xs">
                      ⏳ UPI UNDER REVIEW
                    </span>
                  ) : (
                    <span className="text-xs px-2.5 py-1 rounded-full font-extrabold bg-purple-100 text-purple-900 border border-purple-300 inline-flex items-center gap-1.5 shadow-2xs">
                      ⏳ UNPAID / PENDING
                    </span>
                  )}
                </div>

                <span className="text-xs text-muted">
                  {new Date(order.createdAt).toLocaleString("en-IN")}
                </span>
              </div>

              {/* Customer & Order Details */}
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <p className="text-sm font-semibold text-charcoal">
                    {order.customerName} — {order.phone}
                  </p>
                  <p className="text-xs text-muted">
                    {order.fulfillmentType === "pickup"
                      ? `Store Outlet Pickup: ${order.pickupOutlet}`
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

                  {/* Quick 1-Click Action Buttons */}
                  <div className="flex flex-wrap items-center justify-end gap-1.5">
                    {/* Confirmation Button */}
                    {isAwaiting && (
                      <button
                        type="button"
                        onClick={() => handleConfirmOrder(order.id)}
                        className="px-3.5 py-1.5 rounded-lg bg-[#184D3B] hover:bg-[#12382B] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> Confirm Order
                      </button>
                    )}

                    {/* Delivery 1-Click Toggle */}
                    {!isDelivered && !isCancelled && (
                      <button
                        type="button"
                        onClick={() => updateOrder(order.id, { status: "Delivered" })}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                        title="Mark order as delivered"
                      >
                        <Truck className="w-3.5 h-3.5" /> Mark Delivered
                      </button>
                    )}
                    {isDelivered && !isCancelled && (
                      <button
                        type="button"
                        onClick={() => updateOrder(order.id, { status: "Shipped" })}
                        className="px-2.5 py-1.5 rounded-lg border border-sand bg-oat hover:bg-sand text-charcoal text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                        title="Revert to Pending Delivery"
                      >
                        <RotateCcw className="w-3 h-3 text-muted" /> Mark Undelivered
                      </button>
                    )}

                    {/* Payment 1-Click Toggle */}
                    {!isPaid && !isCancelled && (
                      <button
                        type="button"
                        onClick={() => updateOrder(order.id, { paymentStatus: "PAID" })}
                        className="px-3 py-1.5 rounded-lg bg-[#184D3B] hover:bg-[#12382B] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                        title="Mark payment as received in full"
                      >
                        <Check className="w-3.5 h-3.5 text-emerald-300" /> Mark Paid
                      </button>
                    )}
                    {isPaid && !isCancelled && (
                      <button
                        type="button"
                        onClick={() => updateOrder(order.id, { paymentStatus: "Pending" })}
                        className="px-2.5 py-1.5 rounded-lg border border-sand bg-oat hover:bg-sand text-charcoal text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer"
                        title="Revert to Unpaid / Pending"
                      >
                        <RotateCcw className="w-3 h-3 text-muted" /> Mark Unpaid
                      </button>
                    )}

                    {/* WhatsApp direct customer chat link */}
                    <a
                      href={`https://wa.me/91${order.phone.replace(/\D/g, "").slice(-10)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1.5 rounded-lg border border-sand bg-oat hover:bg-sand text-[11px] font-semibold text-charcoal inline-flex items-center gap-1"
                      title="Open WhatsApp chat with customer"
                    >
                      <MessageSquare className="w-3 h-3 text-[#184D3B]" /> WhatsApp
                    </a>

                    {/* Delete single order */}
                    <button
                      type="button"
                      onClick={() => handleDeleteSingleOrder(order.id)}
                      className="px-2.5 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white text-[11px] font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                      title="Delete this order permanently"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>

                    {order.paymentScreenshot && (
                      <button
                        type="button"
                        onClick={() => setPreviewScreenshotUrl(order.paymentScreenshot!)}
                        className="px-3 py-1.5 rounded-lg border border-sand bg-oat hover:bg-sand text-xs font-semibold text-charcoal inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Screenshot
                      </button>
                    )}
                  </div>
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
                        actual received bank/UPI funds before marking Paid. Screenshots are not proof.
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
        };

        return (
          <div className="space-y-6">
            {/* Top Interactive Metric Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {/* Undelivered Card */}
              <button
                type="button"
                onClick={() => {
                  setOrderLayoutMode("delivery-groups");
                  setOrderFilterView("undelivered");
                }}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                  orderFilterView === "undelivered"
                    ? "bg-blue-600 text-white border-blue-700 shadow-sm"
                    : "bg-white text-charcoal border-blue-200 hover:border-blue-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold uppercase ${orderFilterView === "undelivered" ? "text-blue-100" : "text-blue-700"}`}>
                    To Deliver
                  </span>
                  <Truck className="w-4 h-4" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold">{undeliveredCount}</span>
                  <span className="text-xs ml-1 opacity-80">orders</span>
                </div>
                <p className="text-xs font-semibold mt-1">₹{undeliveredTotal.toLocaleString("en-IN")}</p>
                <p className={`text-[10px] mt-0.5 ${orderFilterView === "undelivered" ? "text-blue-100" : "text-muted"}`}>
                  Confirmed / Packed / In Transit
                </p>
              </button>

              {/* Delivered Card */}
              <button
                type="button"
                onClick={() => {
                  setOrderLayoutMode("delivery-groups");
                  setOrderFilterView("delivered");
                }}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                  orderFilterView === "delivered"
                    ? "bg-emerald-700 text-white border-emerald-800 shadow-sm"
                    : "bg-white text-charcoal border-emerald-200 hover:border-emerald-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold uppercase ${orderFilterView === "delivered" ? "text-emerald-100" : "text-emerald-700"}`}>
                    Delivered
                  </span>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold">{deliveredCount}</span>
                  <span className="text-xs ml-1 opacity-80">orders</span>
                </div>
                <p className="text-xs font-semibold mt-1">₹{deliveredTotal.toLocaleString("en-IN")}</p>
                <p className={`text-[10px] mt-0.5 ${orderFilterView === "delivered" ? "text-emerald-100" : "text-muted"}`}>
                  Completed handovers
                </p>
              </button>

              {/* Unpaid Card */}
              <button
                type="button"
                onClick={() => {
                  setOrderLayoutMode("payment-groups");
                  setOrderFilterView("unpaid");
                }}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                  orderFilterView === "unpaid"
                    ? "bg-purple-700 text-white border-purple-800 shadow-sm"
                    : "bg-white text-charcoal border-purple-200 hover:border-purple-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold uppercase ${orderFilterView === "unpaid" ? "text-purple-100" : "text-purple-700"}`}>
                    Unpaid / Pending
                  </span>
                  <Clock className="w-4 h-4" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold">{unpaidCount}</span>
                  <span className="text-xs ml-1 opacity-80">orders</span>
                </div>
                <p className="text-xs font-semibold mt-1">₹{unpaidTotal.toLocaleString("en-IN")}</p>
                <p className={`text-[10px] mt-0.5 ${orderFilterView === "unpaid" ? "text-purple-100" : "text-muted"}`}>
                  COD / Payment review
                </p>
              </button>

              {/* Paid Card */}
              <button
                type="button"
                onClick={() => {
                  setOrderLayoutMode("payment-groups");
                  setOrderFilterView("paid");
                }}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                  orderFilterView === "paid"
                    ? "bg-[#184D3B] text-white border-[#12382B] shadow-sm"
                    : "bg-white text-charcoal border-[#C7D0C9] hover:border-[#184D3B]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold uppercase ${orderFilterView === "paid" ? "text-emerald-100" : "text-[#184D3B]"}`}>
                    Paid in Full
                  </span>
                  <Check className="w-4 h-4" />
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold">{paidCount}</span>
                  <span className="text-xs ml-1 opacity-80">orders</span>
                </div>
                <p className="text-xs font-semibold mt-1">₹{paidTotal.toLocaleString("en-IN")}</p>
                <p className={`text-[10px] mt-0.5 ${orderFilterView === "paid" ? "text-emerald-100" : "text-muted"}`}>
                  Verified &amp; Received
                </p>
              </button>

              {/* Awaiting Confirmation Card */}
              <button
                type="button"
                onClick={() => {
                  setOrderLayoutMode("delivery-groups");
                  setOrderFilterView("awaiting");
                }}
                className={`p-4 rounded-2xl border text-left cursor-pointer transition-all col-span-2 md:col-span-1 ${
                  orderFilterView === "awaiting"
                    ? "bg-amber-600 text-white border-amber-700 shadow-sm"
                    : "bg-white text-charcoal border-amber-200 hover:border-amber-400"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold uppercase ${orderFilterView === "awaiting" ? "text-amber-100" : "text-amber-800"}`}>
                    New / Awaiting
                  </span>
                  <span>🔔</span>
                </div>
                <div className="mt-2">
                  <span className="text-2xl font-bold">{awaitingCount}</span>
                  <span className="text-xs ml-1 opacity-80">orders</span>
                </div>
                <p className="text-xs font-semibold mt-1">₹{awaitingTotal.toLocaleString("en-IN")}</p>
                <p className={`text-[10px] mt-0.5 ${orderFilterView === "awaiting" ? "text-amber-100" : "text-muted"}`}>
                  Needs confirmation
                </p>
              </button>
            </div>

            {/* View Mode Switcher & Filter Controls */}
            <div className="bg-white rounded-2xl border border-sand p-3.5 space-y-3 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-oat/70 rounded-xl">
                  <button
                    type="button"
                    onClick={() => {
                      setOrderLayoutMode("delivery-groups");
                      setOrderFilterView("all");
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all ${
                      orderLayoutMode === "delivery-groups"
                        ? "bg-white text-charcoal shadow-xs"
                        : "text-muted hover:text-charcoal"
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5 text-blue-600" />
                    <span>🚚 Delivery Separation (Undelivered vs Delivered)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setOrderLayoutMode("payment-groups");
                      setOrderFilterView("all");
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all ${
                      orderLayoutMode === "payment-groups"
                        ? "bg-white text-charcoal shadow-xs"
                        : "text-muted hover:text-charcoal"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>💳 Payment Separation (Unpaid vs Paid)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOrderLayoutMode("filtered-list")}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer transition-all ${
                      orderLayoutMode === "filtered-list"
                        ? "bg-white text-charcoal shadow-xs"
                        : "text-muted hover:text-charcoal"
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-muted" />
                    <span>Filtered List View</span>
                  </button>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-muted absolute left-3 top-2.5" />
                  <input
                    type="search"
                    value={orderSearch}
                    onChange={(e) => setOrderSearch(e.target.value)}
                    placeholder="Search ID, customer, phone, ref..."
                    className="w-full pl-9 pr-3 py-2 rounded-full bg-cream border border-sand text-xs focus:outline-none focus:border-sage"
                  />
                </div>
              </div>

              {/* Secondary Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-sand/50">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-muted mr-1">Payment Method:</span>
                  <button
                    type="button"
                    onClick={() => setOrderPaymentView("all")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border cursor-pointer transition-colors ${
                      orderPaymentView === "all"
                        ? "bg-charcoal text-white border-charcoal"
                        : "bg-white text-charcoal border-sand hover:bg-oat"
                    }`}
                  >
                    All Methods
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderPaymentView("upi")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border inline-flex items-center gap-1 cursor-pointer transition-colors ${
                      orderPaymentView === "upi"
                        ? "bg-[#184D3B] text-white border-[#184D3B]"
                        : "bg-white text-charcoal border-sand hover:bg-oat"
                    }`}
                  >
                    <QrCode className="w-3 h-3" /> UPI Prepaid {upiReviewCount > 0 && `(${upiReviewCount} review)`}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderPaymentView("cod")}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border inline-flex items-center gap-1 cursor-pointer transition-colors ${
                      orderPaymentView === "cod"
                        ? "bg-[#184D3B] text-white border-[#184D3B]"
                        : "bg-white text-charcoal border-sand hover:bg-oat"
                    }`}
                  >
                    <Banknote className="w-3 h-3" /> Cash on Delivery {codPendingCount > 0 && `(${codPendingCount} pending)`}
                  </button>
                </div>

                {orderLayoutMode === "filtered-list" && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setOrderFilterView("all")}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                        orderFilterView === "all" ? "bg-charcoal text-white" : "bg-oat text-charcoal hover:bg-sand"
                      }`}
                    >
                      All ({orders.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderFilterView("undelivered")}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                        orderFilterView === "undelivered" ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-900 border border-blue-200"
                      }`}
                    >
                      Pending Delivery ({undeliveredCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderFilterView("delivered")}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                        orderFilterView === "delivered" ? "bg-emerald-700 text-white" : "bg-emerald-50 text-emerald-900 border border-emerald-200"
                      }`}
                    >
                      Delivered ({deliveredCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderFilterView("unpaid")}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                        orderFilterView === "unpaid" ? "bg-purple-700 text-white" : "bg-purple-50 text-purple-900 border border-purple-200"
                      }`}
                    >
                      Unpaid ({unpaidCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderFilterView("paid")}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                        orderFilterView === "paid" ? "bg-[#184D3B] text-white" : "bg-emerald-50 text-emerald-900 border border-emerald-200"
                      }`}
                    >
                      Paid ({paidCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderFilterView("awaiting")}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                        orderFilterView === "awaiting" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-900 border border-amber-200"
                      }`}
                    >
                      Awaiting ({awaitingCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrderFilterView("cancelled")}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${
                        orderFilterView === "cancelled" ? "bg-red-700 text-white" : "bg-red-50 text-red-900 border border-red-200"
                      }`}
                    >
                      Cancelled ({cancelledCount})
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* View Render 1: Delivery Separation Mode (Undelivered vs Delivered) */}
            {orderLayoutMode === "delivery-groups" && (
              <div className="space-y-8">
                {/* Section 1: Pending Delivery / Undelivered */}
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-blue-950 flex items-center gap-2">
                          <span>PENDING DELIVERY (UNDELIVERED)</span>
                          <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-xs font-bold">
                            {displayedUndeliveredOrders.length}
                          </span>
                        </h2>
                        <p className="text-[11px] text-blue-800">
                          Orders confirmed, packed, or shipped awaiting final handover to customer.
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-blue-700 font-semibold uppercase">Pending Delivery Total</p>
                      <p className="text-base font-bold text-blue-950">₹{displayedUndeliveredOrders.reduce((s, o) => s + o.total, 0).toLocaleString("en-IN")}</p>
                    </div>
                  </div>

                  {displayedUndeliveredOrders.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-white border border-sand text-center text-xs text-muted">
                      No undelivered orders pending delivery.
                    </div>
                  ) : (
                    displayedUndeliveredOrders.map(renderOrderCard)
                  )}
                </div>

                {/* Section 2: Delivered Orders */}
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                          <span>SUCCESSFULLY DELIVERED</span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-700 text-white text-xs font-bold">
                            {displayedDeliveredOrders.length}
                          </span>
                        </h2>
                        <p className="text-[11px] text-emerald-800">
                          Orders successfully handed over and fulfilled to customers.
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-emerald-700 font-semibold uppercase">Delivered Revenue Total</p>
                      <p className="text-base font-bold text-emerald-950">₹{displayedDeliveredOrders.reduce((s, o) => s + o.total, 0).toLocaleString("en-IN")}</p>
                    </div>
                  </div>

                  {displayedDeliveredOrders.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-white border border-sand text-center text-xs text-muted">
                      No delivered orders recorded yet.
                    </div>
                  ) : (
                    displayedDeliveredOrders.map(renderOrderCard)
                  )}
                </div>

                {/* Section 3: Awaiting Confirmation */}
                {displayedAwaitingOrders.length > 0 && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold text-sm">
                          🔔
                        </div>
                        <div>
                          <h2 className="text-sm font-bold text-amber-950 flex items-center gap-2">
                            <span>AWAITING MERCHANT CONFIRMATION</span>
                            <span className="px-2 py-0.5 rounded-full bg-amber-600 text-white text-xs font-bold">
                              {displayedAwaitingOrders.length}
                            </span>
                          </h2>
                          <p className="text-[11px] text-amber-800">
                            New incoming orders requiring phone or payment verification before packing.
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-amber-700 font-semibold uppercase">Awaiting Total</p>
                        <p className="text-base font-bold text-amber-950">₹{displayedAwaitingOrders.reduce((s, o) => s + o.total, 0).toLocaleString("en-IN")}</p>
                      </div>
                    </div>

                    {displayedAwaitingOrders.map(renderOrderCard)}
                  </div>
                )}

                {/* Section 4: Cancelled Orders */}
                {displayedCancelledOrders.length > 0 && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-red-700 text-white flex items-center justify-center font-bold">
                          <XCircle className="w-4 h-4" />
                        </div>
                        <div>
                          <h2 className="text-sm font-bold text-red-950 flex items-center gap-2">
                            <span>CANCELLED ORDERS</span>
                            <span className="px-2 py-0.5 rounded-full bg-red-700 text-white text-xs font-bold">
                              {displayedCancelledOrders.length}
                            </span>
                          </h2>
                          <p className="text-[11px] text-red-800">
                            Orders cancelled or rejected; inventory has been automatically restored.
                          </p>
                        </div>
                      </div>
                    </div>

                    {displayedCancelledOrders.map(renderOrderCard)}
                  </div>
                )}
              </div>
            )}

            {/* View Render 2: Payment Separation Mode (Unpaid vs Paid) */}
            {orderLayoutMode === "payment-groups" && (
              <div className="space-y-8">
                {/* Section 1: Unpaid / Pending Payment */}
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-purple-50 border border-purple-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-purple-700 text-white flex items-center justify-center font-bold">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-purple-950 flex items-center gap-2">
                          <span>UNPAID / PENDING PAYMENT</span>
                          <span className="px-2 py-0.5 rounded-full bg-purple-700 text-white text-xs font-bold">
                            {displayedUnpaidOrders.length}
                          </span>
                        </h2>
                        <p className="text-[11px] text-purple-800">
                          Cash on Delivery to be collected on doorstep, or UPI transfers awaiting bank confirmation.
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-purple-700 font-semibold uppercase">Pending Collection</p>
                      <p className="text-base font-bold text-purple-950">₹{displayedUnpaidOrders.reduce((s, o) => s + o.total, 0).toLocaleString("en-IN")}</p>
                    </div>
                  </div>

                  {displayedUnpaidOrders.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-white border border-sand text-center text-xs text-muted">
                      No unpaid orders pending collection.
                    </div>
                  ) : (
                    displayedUnpaidOrders.map(renderOrderCard)
                  )}
                </div>

                {/* Section 2: Paid in Full */}
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-[#184D3B] text-white flex items-center justify-center font-bold">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <h2 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                          <span>PAID IN FULL</span>
                          <span className="px-2 py-0.5 rounded-full bg-[#184D3B] text-white text-xs font-bold">
                            {displayedPaidOrders.length}
                          </span>
                        </h2>
                        <p className="text-[11px] text-emerald-800">
                          Verified prepaid UPI or confirmed cash payments received in full.
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-emerald-700 font-semibold uppercase">Paid Revenue Total</p>
                      <p className="text-base font-bold text-emerald-950">₹{displayedPaidOrders.reduce((s, o) => s + o.total, 0).toLocaleString("en-IN")}</p>
                    </div>
                  </div>

                  {displayedPaidOrders.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-white border border-sand text-center text-xs text-muted">
                      No paid orders recorded yet.
                    </div>
                  ) : (
                    displayedPaidOrders.map(renderOrderCard)
                  )}
                </div>

                {/* Section 3: Cancelled Orders */}
                {displayedCancelledOrders.length > 0 && (
                  <div className="space-y-3">
                    <div className="p-3.5 rounded-2xl bg-red-50 border border-red-200 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-red-700 text-white flex items-center justify-center font-bold">
                          <XCircle className="w-4 h-4" />
                        </div>
                        <h2 className="text-sm font-bold text-red-950">
                          CANCELLED ORDERS ({displayedCancelledOrders.length})
                        </h2>
                      </div>
                    </div>
                    {displayedCancelledOrders.map(renderOrderCard)}
                  </div>
                )}
              </div>
            )}

            {/* View Render 3: Filtered List Mode */}
            {orderLayoutMode === "filtered-list" && (
              <div className="space-y-4">
                {filteredOrders.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-sand p-10 text-center text-sm text-muted">
                    No matching orders found.
                  </div>
                ) : (
                  filteredOrders.map(renderOrderCard)
                )}
              </div>
            )}
          </div>
        );
      })()}

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

            {/* Attached Photo Upload Directly to Add Product */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-xs font-semibold text-charcoal">
                Product Photo (Direct Upload)
              </label>
              {newProductImage ? (
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-oat border border-sand">
                  <img
                    src={newProductImage}
                    alt="Product preview"
                    className="w-12 h-12 rounded-lg object-contain bg-white p-1 border border-sand"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-charcoal truncate">Photo Attached</p>
                    <p className="text-[10px] text-sage">Will save with new product</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewProductImage("")}
                    className="p-1 text-muted hover:text-crimson cursor-pointer"
                    title="Remove attached photo"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border border-dashed border-sage/60 bg-mint-light/40 hover:bg-mint-light text-xs font-semibold text-sage cursor-pointer transition-colors">
                  <ImagePlus className="w-4 h-4" />
                  <span>{uploadingNewProductImage ? "Uploading..." : "Attach Product Photo"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleNewProductImageUpload}
                    disabled={uploadingNewProductImage}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-full bg-sage text-cream text-sm font-semibold hover:bg-sage-dark cursor-pointer shadow-sm"
            >
              Add Product to Catalog
            </button>
          </form>

          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-muted absolute left-3.5 top-3" />
                <input
                  type="search"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search products to edit name, variants, fragrance, or stock..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-full bg-white border border-sand text-sm"
                />
              </div>
              <a
                href="/api/admin/catalogue-pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-full bg-oat border border-sand text-charcoal text-xs font-bold inline-flex items-center gap-1.5 hover:border-sage shrink-0"
                title="Download complete live catalogue as formatted PDF"
              >
                <Download className="w-3.5 h-3.5 text-sage" />
                <span>Download Catalogue PDF</span>
              </a>
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
                      <p className="text-xs text-muted">
                        {p.categoryName} • {p.variants.length} variant{p.variants.length > 1 ? "s" : ""}
                        {p.scent ? ` • ${p.scent}` : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setEditingProduct(JSON.parse(JSON.stringify(p)))}
                      className="px-3.5 py-1.5 rounded-full bg-[#184D3B] hover:bg-[#12382B] text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="Open full editor to change name, category, fragrance, description, or variants"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Full Edit</span>
                    </button>
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
                      onClick={() => handleDeleteProduct(p.id, p.name)}
                      className="px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-red-700 hover:bg-red-600 hover:text-white text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                      title="Remove product from store"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
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
                      <button
                        type="button"
                        onClick={() => handleDeleteVariant(p, v.id)}
                        className="ml-1 p-1 rounded text-muted hover:text-crimson cursor-pointer"
                        title={`Remove ${v.label}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab: Sales & Revenue Reports */}
      {tab === "reports" && (
        <div className="space-y-6">
          {/* Header & Controls Bar */}
          <div className="bg-white rounded-3xl border border-sand p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xs">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sage bg-mint-light px-3 py-1 rounded-full mb-1">
                <BarChart3 className="w-3.5 h-3.5 text-sage" /> Executive Sales Reports
              </span>
              <h2 className="font-editorial text-2xl font-bold text-charcoal">
                Defined Sales &amp; Revenue Analytics
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Filter orders by defined date range, analyze performance, and download official PDF or CSV reports.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href={`/api/admin/sales-report-pdf?range=${reportRange}${reportRange === "custom" ? `&from=${reportFromDate}&to=${reportToDate}` : ""}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-full bg-[#184D3B] hover:bg-[#12382B] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
                title="Download formatted sales report PDF"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Report PDF</span>
              </a>

              <button
                type="button"
                onClick={handleExportSalesReportCsv}
                className="px-4 py-2.5 rounded-full bg-oat border border-sand text-charcoal text-xs font-bold inline-flex items-center gap-1.5 hover:border-sage cursor-pointer"
                title="Export order details to CSV"
              >
                <Download className="w-3.5 h-3.5 text-sage" />
                <span>Export CSV</span>
              </button>

              <a
                href="/api/admin/catalogue-pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-full bg-oat border border-sand text-charcoal text-xs font-bold inline-flex items-center gap-1.5 hover:border-sage"
                title="Download live product catalogue PDF"
              >
                <FileText className="w-3.5 h-3.5 text-sage" />
                <span>Live Catalogue PDF</span>
              </a>
            </div>
          </div>

          {/* Date Range Selector */}
          <div className="bg-white rounded-2xl border border-sand p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase text-muted tracking-wider mr-1">Period:</span>
              {(
                [
                  ["today", "Today"],
                  ["yesterday", "Yesterday"],
                  ["7days", "Last 7 Days"],
                  ["month", "This Month"],
                  ["all", "All Time"],
                  ["custom", "Custom Range"],
                ] as const
              ).map(([rng, lbl]) => (
                <button
                  key={rng}
                  type="button"
                  onClick={() => setReportRange(rng)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold border cursor-pointer transition-colors ${
                    reportRange === rng
                      ? "bg-[#184D3B] text-white border-[#184D3B]"
                      : "bg-white text-charcoal border-sand hover:bg-oat"
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>

            {reportRange === "custom" && (
              <div className="flex items-center gap-2 text-xs">
                <input
                  type="date"
                  value={reportFromDate}
                  onChange={(e) => setReportFromDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-sand bg-cream text-xs"
                />
                <span className="text-muted">to</span>
                <input
                  type="date"
                  value={reportToDate}
                  onChange={(e) => setReportToDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-sand bg-cream text-xs"
                />
              </div>
            )}
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-sand p-5 space-y-1">
              <p className="text-xs text-muted uppercase font-semibold">Net Revenue</p>
              <p className="text-3xl font-bold text-charcoal">₹{reportNetSales}</p>
              <p className="text-[11px] text-sage font-medium">Excludes cancelled orders</p>
            </div>

            <div className="bg-white rounded-2xl border border-sand p-5 space-y-1">
              <p className="text-xs text-muted uppercase font-semibold">Orders Placed</p>
              <p className="text-3xl font-bold text-charcoal">{reportOrders.length}</p>
              <p className="text-[11px] text-muted">
                {reportConfirmedOrders.length} confirmed • {reportOrders.length - reportActiveOrders.length} cancelled
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-sand p-5 space-y-1">
              <p className="text-xs text-muted uppercase font-semibold">Average Order Value (AOV)</p>
              <p className="text-3xl font-bold text-charcoal">₹{reportAov}</p>
              <p className="text-[11px] text-muted">Per active customer order</p>
            </div>

            <div className="bg-white rounded-2xl border border-sand p-5 space-y-1">
              <p className="text-xs text-muted uppercase font-semibold">Payment Split</p>
              <div className="text-xs space-y-0.5 pt-1">
                <div className="flex justify-between">
                  <span className="text-muted">UPI Prepaid:</span>
                  <span className="font-bold text-[#184D3B]">₹{reportUpiSales} ({reportUpiOrders.length})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Cash on Delivery:</span>
                  <span className="font-bold text-charcoal">₹{reportCodSales} ({reportCodOrders.length})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Selling Products Breakdown */}
          {reportTopProducts.length > 0 && (
            <div className="bg-white rounded-3xl border border-sand p-6 space-y-4">
              <h3 className="font-serif-brand text-lg font-semibold text-charcoal flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sage" /> Top Performing Products in this Period
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {reportTopProducts.map((tp, idx) => (
                  <div key={tp.name} className="p-3.5 rounded-2xl bg-oat border border-sand space-y-1">
                    <span className="text-[10px] font-bold text-muted uppercase">Rank #{idx + 1}</span>
                    <p className="text-xs font-bold text-charcoal truncate" title={tp.name}>{tp.name}</p>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="text-sage font-medium">{tp.qty} units sold</span>
                      <span className="font-bold text-charcoal">₹{tp.revenue}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Delivery & Store Settings */}
      {tab === "settings" && (
        <div className="max-w-2xl bg-white rounded-3xl border border-sand p-8 space-y-6">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sage bg-mint-light px-3 py-1 rounded-full mb-1">
              <Settings className="w-3.5 h-3.5 text-sage" /> Store &amp; Delivery Configuration
            </span>
            <h2 className="font-editorial text-2xl font-bold text-charcoal">
              Delivery Charges &amp; Store Setup
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Control your standard doorstep delivery fee. Free delivery badging has been completely removed across the storefront. Store pickup is automatically ₹0.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-oat border border-sand space-y-4">
            <div>
              <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-1.5">
                Standard Doorstep Delivery Charge (₹)
              </label>
              <div className="flex items-center gap-3">
                <div className="relative w-40">
                  <span className="absolute left-3.5 top-2.5 text-sm font-bold text-muted">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={deliveryCharge}
                    onChange={(e) => setDeliveryCharge(Math.max(0, Number(e.target.value)))}
                    className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white border border-sand text-sm font-bold text-charcoal focus:outline-none focus:border-sage"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleSaveDeliveryCharge}
                  disabled={savingDeliveryCharge}
                  className="px-5 py-2.5 rounded-xl bg-[#184D3B] hover:bg-[#12382B] text-white text-xs font-bold cursor-pointer transition-all disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{savingDeliveryCharge ? "Saving..." : "Save Delivery Charge"}</span>
                </button>
              </div>
              <p className="text-[11px] text-muted mt-1.5">
                This exact amount will be applied to all customer doorstep delivery orders at checkout.
              </p>
            </div>

            <div className="pt-3 border-t border-sand/60 text-xs space-y-2">
              <p className="font-bold text-charcoal">Active Fulfillment Options:</p>
              <div className="flex items-center gap-2 text-muted">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Doorstep Delivery: <strong>₹{deliveryCharge}</strong> standard shipping charge</span>
              </div>
              <div className="flex items-center gap-2 text-muted">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Store Pickup: <strong>₹0 (FREE)</strong> at Poovar Uchakkada &amp; Pallichal Jn</span>
              </div>
            </div>
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

      {/* Bulk Stock Modification Modal */}
      {showBulkStockModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-mint-light text-[#184D3B] flex items-center justify-center">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-charcoal">Bulk Stock Modification</h3>
                  <p className="text-xs text-muted">Update stock across products in one click</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBulkStockModal(false)}
                className="p-1.5 rounded-lg hover:bg-oat cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5">
                  Target Category
                </label>
                <select
                  value={bulkStockCategory}
                  onChange={(e) => setBulkStockCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-cream border border-sand text-xs font-semibold text-charcoal"
                >
                  <option value="all">All Categories ({totalVariants} variants)</option>
                  {BRAND.categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5">
                  Action Type
                </label>
                <div className="space-y-2">
                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-sand bg-cream/50 cursor-pointer hover:bg-cream">
                    <input
                      type="radio"
                      name="bulkAction"
                      checked={bulkStockAction === "restock_low"}
                      onChange={() => setBulkStockAction("restock_low")}
                      className="mt-0.5 accent-sage"
                    />
                    <div>
                      <p className="font-bold text-charcoal">Restock Low Inventory (&lt;15 units)</p>
                      <p className="text-[11px] text-muted">
                        Only variants with stock below 15 will be updated to the target amount.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-sand bg-cream/50 cursor-pointer hover:bg-cream">
                    <input
                      type="radio"
                      name="bulkAction"
                      checked={bulkStockAction === "set_all"}
                      onChange={() => setBulkStockAction("set_all")}
                      className="mt-0.5 accent-sage"
                    />
                    <div>
                      <p className="font-bold text-charcoal">Set Exact Stock for All</p>
                      <p className="text-[11px] text-muted">
                        Overwrites current stock with this exact number for matching items.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-sand bg-cream/50 cursor-pointer hover:bg-cream">
                    <input
                      type="radio"
                      name="bulkAction"
                      checked={bulkStockAction === "add_all"}
                      onChange={() => setBulkStockAction("add_all")}
                      className="mt-0.5 accent-sage"
                    />
                    <div>
                      <p className="font-bold text-charcoal">Add To Current Stock</p>
                      <p className="text-[11px] text-muted">
                        Increments existing inventory by this amount for received shipments.
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 p-3 rounded-xl border border-red-200 bg-red-50/50 cursor-pointer hover:bg-red-50">
                    <input
                      type="radio"
                      name="bulkAction"
                      checked={bulkStockAction === "zero_out"}
                      onChange={() => setBulkStockAction("zero_out")}
                      className="mt-0.5 accent-red-600"
                    />
                    <div>
                      <p className="font-bold text-red-700">Zero Out Stock (Mark Out of Stock)</p>
                      <p className="text-[11px] text-red-600/80">
                        Sets stock to 0 for matching items.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              {bulkStockAction !== "zero_out" && (
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-muted mb-1.5">
                    Stock Quantity / Increment Amount
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={bulkStockAmount}
                    onChange={(e) => setBulkStockAmount(e.target.value)}
                    placeholder="50"
                    className="w-full px-4 py-2.5 rounded-xl bg-cream border border-sand text-sm font-bold text-charcoal"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-sand">
              <button
                type="button"
                onClick={() => setShowBulkStockModal(false)}
                className="px-4 py-2 rounded-xl border border-sand bg-white text-xs font-semibold text-charcoal hover:bg-oat cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkModifyStock}
                className="px-5 py-2.5 rounded-xl bg-sage hover:bg-sage-dark text-cream text-xs font-bold cursor-pointer transition-colors shadow-sm"
              >
                Apply Stock Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Promo Coupon Manager */}
      {tab === "coupons" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-sand p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sage bg-mint-light px-3 py-1 rounded-full mb-1">
                <Ticket className="w-3.5 h-3.5 text-sage" /> Custom Promo Coupons
              </span>
              <h2 className="font-serif-brand text-2xl font-bold text-charcoal">
                Owner Promo &amp; Discount Codes
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Create custom discount coupons that customers can apply at cart drawer &amp; checkout.
              </p>
            </div>
            <div className="text-xs text-muted bg-oat px-3 py-2 rounded-xl border border-sand">
              Total Active Coupons: <strong className="text-charcoal">{coupons.filter((c) => c.active).length} Custom</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create Promo Coupon Card */}
            <div className="bg-white rounded-3xl border border-sand p-6 space-y-4 shadow-xs lg:col-span-1">
              <div className="flex items-center gap-2 border-b border-sand pb-3">
                <Plus className="w-4 h-4 text-sage" />
                <h3 className="font-bold text-sm text-charcoal">Create New Promo Coupon</h3>
              </div>

              <form onSubmit={handleSaveCoupon} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    Coupon Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="e.g. SAVE25"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-cream border border-sand text-xs font-mono font-bold tracking-wider text-charcoal focus:outline-none focus:border-sage"
                  />
                  <p className="text-[10px] text-muted mt-0.5">Auto-converted to uppercase</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1">
                      Discount % *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        required
                        value={couponDiscount}
                        onChange={(e) => setCouponDiscount(e.target.value)}
                        placeholder="20"
                        className="w-full px-3 py-2 rounded-xl bg-cream border border-sand text-xs font-bold text-charcoal pr-7 focus:outline-none focus:border-sage"
                      />
                      <span className="absolute right-2.5 top-2 text-xs font-bold text-muted">%</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-charcoal mb-1">
                      Min Order (₹)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={couponMinOrder}
                      onChange={(e) => setCouponMinOrder(e.target.value)}
                      placeholder="499"
                      className="w-full px-3 py-2 rounded-xl bg-cream border border-sand text-xs font-bold text-charcoal focus:outline-none focus:border-sage"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    Description / Offer Label (optional)
                  </label>
                  <input
                    type="text"
                    value={couponDesc}
                    onChange={(e) => setCouponDesc(e.target.value)}
                    placeholder="e.g. Festive Special 25% Off"
                    className="w-full px-3 py-2 rounded-xl bg-cream border border-sand text-xs text-charcoal focus:outline-none focus:border-sage"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingCoupon || !couponCode.trim()}
                  className="w-full py-2.5 rounded-xl bg-sage hover:bg-sage-dark text-cream font-bold text-xs cursor-pointer transition-colors shadow-xs disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{savingCoupon ? "Saving..." : "Create Promo Coupon"}</span>
                </button>
              </form>
            </div>

            {/* Existing Promo Coupons List */}
            <div className="bg-white rounded-3xl border border-sand p-6 shadow-xs lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b border-sand pb-3">
                <h3 className="font-bold text-sm text-charcoal flex items-center gap-2">
                  <Ticket className="w-4 h-4 text-sage" />
                  <span>Custom Store Coupons ({coupons.length})</span>
                </h3>
                <span className="text-[11px] text-muted">Applied dynamically at checkout</span>
              </div>

              {coupons.length === 0 ? (
                <div className="py-12 text-center text-muted text-xs space-y-2">
                  <Ticket className="w-8 h-8 text-muted/40 mx-auto" />
                  <p className="font-semibold text-charcoal">No Custom Promo Coupons Created Yet</p>
                  <p className="max-w-xs mx-auto text-[11px]">
                    Use the form on the left to create your first custom coupon code (e.g. SAVE25 for 25% off).
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {coupons.map((c) => (
                    <div
                      key={c.code}
                      className={`p-4 rounded-2xl border transition-all ${
                        c.active
                          ? "bg-cream/40 border-sand shadow-2xs"
                          : "bg-oat/50 border-sand/60 opacity-60"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono font-extrabold text-sm px-2.5 py-1 rounded-lg bg-white border border-sand text-charcoal shadow-2xs">
                          {c.code}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleCoupon(c)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase transition-colors cursor-pointer ${
                              c.active
                                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                            }`}
                            title="Click to toggle active/pause"
                          >
                            {c.active ? "Active" : "Paused"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCoupon(c.code)}
                            className="p-1 rounded-lg text-muted hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                            title="Delete Coupon"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-md bg-sage text-cream font-bold text-[10px]">
                            {c.discountPercent}% OFF
                          </span>
                          <span className="text-muted text-[11px]">
                            Min order: <strong>₹{c.minOrder}</strong>
                          </span>
                        </div>
                        {c.description && (
                          <p className="text-[11px] text-muted italic line-clamp-1">{c.description}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* System Built-in Coupons Info */}
              <div className="pt-4 border-t border-sand">
                <p className="text-[11px] font-bold text-muted uppercase tracking-wider mb-2">
                  Standard Built-in Coupons (Always Active)
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="p-2 rounded-xl bg-oat border border-sand">
                    <span className="font-mono font-bold text-charcoal">EVOKA10</span>
                    <p className="text-[10px] text-muted mt-0.5">10% off • Min ₹499</p>
                  </div>
                  <div className="p-2 rounded-xl bg-oat border border-sand">
                    <span className="font-mono font-bold text-charcoal">REFILL15</span>
                    <p className="text-[10px] text-muted mt-0.5">15% off • Min ₹799</p>
                  </div>
                  <div className="p-2 rounded-xl bg-oat border border-sand">
                    <span className="font-mono font-bold text-charcoal">CLEAN20</span>
                    <p className="text-[10px] text-muted mt-0.5">20% off • Min ₹1199</p>
                  </div>
                </div>
              </div>
            </div>
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
              src={`/api/orders/${encodeURIComponent(previewInvoiceOrder.id)}/invoice?t=${encodeURIComponent(previewInvoiceOrder.updatedAt || String(Date.now()))}`}
              title={`Invoice ${previewInvoiceOrder.invoice?.invoiceNumber}`}
              className="flex-1 w-full bg-[#F4F6F4]"
            />
          </div>
        </div>
      )}
      {/* Full Product Editor Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-sand max-w-2xl w-full p-6 sm:p-8 space-y-5 my-8 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between border-b border-sand pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sage bg-mint-light px-2.5 py-0.5 rounded-full">
                  Catalog Product Editor
                </span>
                <h3 className="text-xl font-bold text-charcoal mt-1 truncate">
                  Edit: {editingProduct.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-1.5 text-muted hover:text-charcoal rounded-full hover:bg-oat cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Basic Info Fields */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">Product Name</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-cream border border-sand text-sm font-semibold"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">Category</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => {
                      const slug = e.target.value as CategorySlug;
                      const catName = BRAND.categories.find((c) => c.slug === slug)?.name || slug;
                      setEditingProduct({ ...editingProduct, category: slug, categoryName: catName });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-cream border border-sand text-sm"
                  >
                    {BRAND.categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">Fragrance / Scent</label>
                  <input
                    type="text"
                    value={editingProduct.scent || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, scent: e.target.value })}
                    placeholder="e.g. Royal Rose, Citrus Burst"
                    className="w-full px-3 py-2 rounded-xl bg-cream border border-sand text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">Tagline / Short Benefit</label>
                <input
                  type="text"
                  value={editingProduct.shortTagline || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, shortTagline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-cream border border-sand text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">Full Description</label>
                <textarea
                  rows={2}
                  value={editingProduct.description || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-cream border border-sand text-sm"
                />
              </div>

              {/* Photo Upload in Editor */}
              <div className="p-3.5 rounded-2xl bg-oat border border-sand flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={editingProduct.image}
                    alt={editingProduct.name}
                    className="w-14 h-14 rounded-xl object-contain bg-white p-1 border border-sand"
                  />
                  <div>
                    <p className="text-xs font-bold text-charcoal">Current Product Image</p>
                    <p className="text-[10px] text-muted truncate max-w-[200px]">{editingProduct.image}</p>
                  </div>
                </div>

                <label className="px-3.5 py-2 rounded-xl bg-white border border-sand text-xs font-semibold text-charcoal hover:border-sage cursor-pointer inline-flex items-center gap-1.5 shadow-xs">
                  <ImagePlus className="w-3.5 h-3.5 text-sage" />
                  <span>Change Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleEditProductImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Variants Management */}
            <div className="pt-2 border-t border-sand space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-charcoal">Product Pack Variants</h4>
                  <p className="text-[11px] text-muted">Manage pack sizes, SKUs, selling prices, MRPs, and stock</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddVariantToEditingProduct}
                  className="px-3 py-1.5 rounded-xl bg-sage-light text-sage text-xs font-bold inline-flex items-center gap-1 hover:bg-sage hover:text-white cursor-pointer transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Variant
                </button>
              </div>

              <div className="space-y-2.5">
                {editingProduct.variants.map((v, vIdx) => (
                  <div key={v.id || vIdx} className="p-3 rounded-2xl bg-cream/70 border border-sand grid grid-cols-2 sm:grid-cols-6 gap-2 items-center">
                    <div>
                      <label className="block text-[10px] font-semibold text-muted mb-0.5">Size/Label</label>
                      <input
                        type="text"
                        value={v.label}
                        onChange={(e) => handleUpdateEditingVariant(v.id, { label: e.target.value })}
                        className="w-full px-2 py-1.5 rounded-lg bg-white border border-sand text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-muted mb-0.5">SKU</label>
                      <input
                        type="text"
                        value={v.sku}
                        onChange={(e) => handleUpdateEditingVariant(v.id, { sku: e.target.value })}
                        className="w-full px-2 py-1.5 rounded-lg bg-white border border-sand text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-muted mb-0.5">Price (₹)</label>
                      <input
                        type="number"
                        value={v.price}
                        onChange={(e) => handleUpdateEditingVariant(v.id, { price: Number(e.target.value) })}
                        className="w-full px-2 py-1.5 rounded-lg bg-white border border-sand text-xs font-bold text-[#184D3B]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-muted mb-0.5">MRP (₹)</label>
                      <input
                        type="number"
                        value={v.mrp}
                        onChange={(e) => handleUpdateEditingVariant(v.id, { mrp: Number(e.target.value) })}
                        className="w-full px-2 py-1.5 rounded-lg bg-white border border-sand text-xs text-muted"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-muted mb-0.5">Stock</label>
                      <input
                        type="number"
                        value={v.stock}
                        onChange={(e) => handleUpdateEditingVariant(v.id, { stock: Number(e.target.value) })}
                        className="w-full px-2 py-1.5 rounded-lg bg-white border border-sand text-xs font-bold"
                      />
                    </div>
                    <div className="flex justify-end pt-3">
                      <button
                        type="button"
                        onClick={() => handleRemoveVariantFromEditingProduct(v.id)}
                        className="p-1.5 text-muted hover:text-crimson rounded-lg hover:bg-red-50 cursor-pointer"
                        title="Delete variant"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-sand">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-5 py-2.5 rounded-full border border-sand text-xs font-semibold text-charcoal hover:bg-oat cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditedProduct}
                disabled={savingProductEdit}
                className="px-6 py-2.5 rounded-full bg-[#184D3B] hover:bg-[#12382B] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingProductEdit ? "Saving Changes..." : "Save Product Changes"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
