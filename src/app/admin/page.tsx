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
  LayoutDashboard,
  Boxes,
  Users,
  Receipt,
  Store,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Wallet,
} from "lucide-react";
import {
  CategorySlug,
  Order,
  OrderStatus,
  PaymentStatus,
  Product,
  ProductVariant,
  PromoCoupon,
} from "@/lib/types";
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

type AdminTab =
  | "dashboard"
  | "orders"
  | "inventory"
  | "products"
  | "customers"
  | "offline"
  | "reports"
  | "settings";

export default function AdminPage() {
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [authError, setAuthError] = useState("");

  const [tab, setTab] = useState<AdminTab>("dashboard");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [csvMode, setCsvMode] = useState<"merge" | "replace">("merge");

  // Delivery & Store Settings
  const [deliveryCharge, setDeliveryCharge] = useState<number>(40);
  const [savingDeliveryCharge, setSavingDeliveryCharge] = useState<boolean>(false);
  const [settingsSubTab, setSettingsSubTab] = useState<"delivery" | "coupons" | "bulk" | "reset">("delivery");

  // Orders expandable state & filters
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});
  const [orderDateRange, setOrderDateRange] = useState<"all" | "today" | "yesterday" | "7days" | "month">("all");
  const [orderChannelFilter, setOrderChannelFilter] = useState<"all" | "online" | "offline">("all");
  const [orderPaymentView, setOrderPaymentView] = useState<"all" | "upi" | "cod">("all");
  const [orderFilter, setOrderFilter] = useState<"All" | OrderStatus>("All");
  const [orderSearch, setOrderSearch] = useState("");
  const [trackingDrafts, setTrackingDrafts] = useState<
    Record<string, { courierName: string; trackingNumber: string }>
  >({});
  const [previewScreenshotUrl, setPreviewScreenshotUrl] = useState<string | null>(null);
  const [previewInvoiceOrder, setPreviewInvoiceOrder] = useState<Order | null>(null);
  const [generatingInvoiceId, setGeneratingInvoiceId] = useState<string | null>(null);

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

  // Rate & Stock Manager state
  const [rateCategory, setRateCategory] = useState<string>("all");
  const [rateSearch, setRateSearch] = useState<string>("");
  const [mrpDrafts, setMrpDrafts] = useState<Record<string, string>>({});
  const [stockDrafts, setStockDrafts] = useState<Record<string, string>>({});
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
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

  // Customers Directory state
  const [customerSearch, setCustomerSearch] = useState<string>("");

  // Offline Sales / POS state
  const [posCustomerName, setPosCustomerName] = useState("");
  const [posCustomerPhone, setPosCustomerPhone] = useState("");
  const [posPaymentMethod, setPosPaymentMethod] = useState<"cash" | "upi" | "card">("cash");
  const [posNotes, setPosNotes] = useState("");
  const [posItems, setPosItems] = useState<
    Array<{
      productId: string;
      variantId: string;
      name: string;
      variantLabel: string;
      price: number;
      mrp: number;
      stock: number;
      quantity: number;
    }>
  >([]);
  const [posSelectedProductId, setPosSelectedProductId] = useState<string>("");
  const [posSelectedVariantId, setPosSelectedVariantId] = useState<string>("");
  const [posSelectedQty, setPosSelectedQty] = useState<number>(1);
  const [posDiscount, setPosDiscount] = useState<number>(0);
  const [posDeliveryFee, setPosDeliveryFee] = useState<number>(0);
  const [submittingPosOrder, setSubmittingPosOrder] = useState<boolean>(false);
  const [offlineSearch, setOfflineSearch] = useState<string>("");

  const fetchData = async () => {
    const [ordRes, prodRes] = await Promise.all([fetch("/api/orders"), fetch("/api/products")]);
    if (!ordRes.ok) return false;
    const ordData = await ordRes.json();
    const prodData = await prodRes.json();
    const loadedOrders: Order[] = ordData.orders || [];
    const loadedProducts: Product[] = prodData.products || [];
    setOrders(loadedOrders);
    setProducts(loadedProducts);

    // Initial draft rates
    const initialPriceDrafts: Record<string, string> = {};
    const initialMrpDrafts: Record<string, string> = {};
    const initialStockDrafts: Record<string, string> = {};
    loadedProducts.forEach((p) => {
      p.variants.forEach((v) => {
        initialPriceDrafts[v.id] = String(v.price);
        initialMrpDrafts[v.id] = String(v.mrp || Math.round(v.price * 1.25));
        initialStockDrafts[v.id] = String(v.stock);
      });
    });
    setPriceDrafts(initialPriceDrafts);
    setMrpDrafts(initialMrpDrafts);
    setStockDrafts(initialStockDrafts);

    // Fetch coupons & store settings
    try {
      const [coupRes, setRes] = await Promise.all([
        fetch("/api/admin/coupons"),
        fetch("/api/admin/settings"),
      ]);
      if (coupRes.ok) {
        const coupData = await coupRes.json();
        setCoupons(coupData.coupons || []);
      }
      if (setRes.ok) {
        const setData = await setRes.json();
        if (typeof setData.deliveryCharge === "number") {
          setDeliveryCharge(setData.deliveryCharge);
        }
      }
    } catch {
      // Non-fatal
    }

    return true;
  };

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/session");
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && isMounted) {
            setUnlocked(true);
            await fetchData();
          }
        }
      } catch {
        // Fallback to pin screen
      } finally {
        if (isMounted) setCheckingSession(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    try {
      const res = await fetch("/api/admin/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUnlocked(true);
        setStatusMsg("✓ Admin console unlocked.");
        await fetchData();
      } else {
        setAuthError(data.error || "Incorrect PIN");
      }
    } catch {
      setAuthError("Network error. Please try again.");
    }
  };

  const handleLogout = async () => {
    await fetch("/api/admin/session", { method: "DELETE" });
    setUnlocked(false);
    setPin("");
    setStatusMsg("");
  };

  const updateOrder = async (
    orderId: string,
    updates: {
      status?: OrderStatus;
      paymentStatus?: PaymentStatus;
      courierName?: string;
      trackingNumber?: string;
      adminAction?: "approve_payment" | "reject_payment" | "confirm_cod";
      paymentRejectedReason?: string;
    }
  ) => {
    try {
      const res = await fetch("/api/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: orderId, ...updates }),
      });
      const data = await res.json();
      if (res.ok && data.order) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
        setStatusMsg(`✓ Order ${orderId} updated.`);
      } else {
        setStatusMsg(data.error || "Update failed.");
      }
    } catch {
      setStatusMsg("Network error updating order.");
    }
  };

  const handleConfirmOrder = async (orderId: string) => {
    await updateOrder(orderId, { status: "Confirmed" });
  };

  const handleGenerateInvoice = async (orderId: string) => {
    setGeneratingInvoiceId(orderId);
    setStatusMsg(`Generating official invoice for ${orderId}...`);
    try {
      const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}/invoice`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok && data.order) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? data.order : o)));
        setStatusMsg(`✓ Invoice ${data.invoice.invoiceNumber} generated.`);
        return data.order as Order;
      } else {
        setStatusMsg(data.error || "Invoice generation failed.");
        alert(data.error || "Could not generate invoice.");
      }
    } catch {
      setStatusMsg("Network error generating invoice.");
    } finally {
      setGeneratingInvoiceId(null);
    }
    return null;
  };

  const handlePrintInvoicePdf = async (order: Order) => {
    let targetOrder = order;
    if (!targetOrder.invoice) {
      const generated = await handleGenerateInvoice(order.id);
      if (!generated) return;
      targetOrder = generated;
    }
    const pdfUrl = `/api/orders/${encodeURIComponent(targetOrder.id)}/invoice?view=1`;
    const printWindow = window.open(pdfUrl, "_blank");
    if (!printWindow) {
      window.location.href = pdfUrl;
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(price);
    const m = parseFloat(mrp);
    const s = parseInt(stock, 10);
    if (!name || isNaN(p) || isNaN(s)) {
      setStatusMsg("Please provide a valid product name, price, and stock count.");
      return;
    }
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const generatedSku = sku.trim() || `EVK-${slug.slice(0, 4).toUpperCase()}-${variantLabel.replace(/\s+/g, "")}`;
    const catObj = BRAND.categories.find((c) => c.slug === category);
    const newProd: Product = {
      id: `p-${Date.now()}`,
      slug,
      name,
      category,
      categoryName: catObj?.name || "Natural Homecare",
      shortTagline: tagline || "Gentle & Effective Formula",
      description: `${tagline || name}. Handcrafted natural homecare formula.`,
      scent: scent || "Natural",
      keyIngredients: ["Plant-based Surfactants", "Soapnut Extract", "Pure Essential Oils"],
      freeFrom: ["SLS / SLES", "Phosphates", "Chlorine", "Synthetic Dyes"],
      howToUse: "Use 20-30ml per standard application. Safe for regular home use.",
      image: newProductImage || getCategoryFallbackImage(category),
      rating: 4.8,
      reviewCount: 12,
      variants: [
        {
          id: `v-${Date.now()}`,
          sku: generatedSku,
          label: variantLabel,
          price: p,
          mrp: !isNaN(m) && m > 0 ? m : Math.round(p * 1.25),
          stock: s,
        },
      ],
    };
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProd),
      });
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products);
        setName("");
        setTagline("");
        setNewProductImage("");
        setStatusMsg(`✓ Product "${name}" added to catalog.`);
      } else {
        setStatusMsg(data.error || "Failed to add product.");
      }
    } catch {
      setStatusMsg("Network error adding product.");
    }
  };

  const handleNewProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingNewProductImage(true);
    setStatusMsg(`Uploading image for new product: ${file.name}...`);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        setNewProductImage(data.url);
        setStatusMsg(`✓ Attached image uploaded: ${file.name}`);
      } else {
        setStatusMsg(data.error || "Image upload failed.");
      }
    } catch {
      setStatusMsg("Network error uploading product image.");
    } finally {
      setUploadingNewProductImage(false);
    }
  };

  const handleEditProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingProduct) return;
    setStatusMsg(`Uploading image for "${editingProduct.name}"...`);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        setEditingProduct((prev) => (prev ? { ...prev, image: data.url } : null));
        setStatusMsg(`✓ Image replaced for "${editingProduct.name}". Click "Save Changes" to commit.`);
      } else {
        setStatusMsg(data.error || "Image upload failed.");
      }
    } catch {
      setStatusMsg("Network error uploading image.");
    }
  };

  const handleSaveEditedProduct = async () => {
    if (!editingProduct) return;
    setSavingProductEdit(true);
    setStatusMsg(`Saving changes for "${editingProduct.name}"...`);
    try {
      const res = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingProduct),
      });
      const data = await res.json();
      if (res.ok && data.products) {
        setProducts(data.products);
        setStatusMsg(`✓ Product "${editingProduct.name}" updated successfully.`);
        setEditingProduct(null);
      } else {
        setStatusMsg(data.error || "Failed to update product.");
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
      sku: `EVK-${editingProduct.slug.slice(0, 4).toUpperCase()}-${editingProduct.variants.length + 1}`,
      label: "New Variant",
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

  const handleSaveDeliveryCharge = async () => {
    setSavingDeliveryCharge(true);
    setStatusMsg("Saving delivery fee setting...");
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryCharge }),
      });
      const data = await res.json();
      if (res.ok) {
        setDeliveryCharge(data.settings.deliveryCharge);
        setStatusMsg(`✓ Delivery charge updated to ₹${data.settings.deliveryCharge}.`);
      } else {
        setStatusMsg(data.error || "Failed to save delivery charge.");
      }
    } catch {
      setStatusMsg("Network error saving delivery charge.");
    } finally {
      setSavingDeliveryCharge(false);
    }
  };

  const handleDeleteProduct = async (id: string, prodName?: string) => {
    if (!confirm(`Delete product "${prodName || id}" and all its variants from the catalog?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/products?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setProducts(data.products);
        setStatusMsg(`✓ Product removed from catalog.`);
      }
    } catch {
      setStatusMsg("Network error deleting product.");
    }
  };

  const handleDeleteVariant = async (product: Product, variantId: string) => {
    if (product.variants.length <= 1) {
      alert("Cannot delete the only pack size of a product. Delete the entire product instead.");
      return;
    }
    if (!confirm(`Remove this variant from "${product.name}"?`)) return;
    const updatedProd: Product = {
      ...product,
      variants: product.variants.filter((v) => v.id !== variantId),
    };
    try {
      const res = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProd),
      });
      const data = await res.json();
      if (res.ok && data.products) {
        setProducts(data.products);
        setStatusMsg(`✓ Variant removed from "${product.name}".`);
      }
    } catch {
      setStatusMsg("Network error removing variant.");
    }
  };

  const handleSaveAllRates = async () => {
    setStatusMsg("Saving all rates, MRPs, and stock counts...");
    try {
      const updatedProducts = products.map((prod) => {
        let changed = false;
        const newVariants = prod.variants.map((v) => {
          const draftP = priceDrafts[v.id];
          const draftM = mrpDrafts[v.id];
          const draftS = stockDrafts[v.id];

          const pNum = draftP !== undefined ? parseFloat(draftP) : v.price;
          const mNum = draftM !== undefined ? parseFloat(draftM) : v.mrp;
          const sNum = draftS !== undefined ? parseInt(draftS, 10) : v.stock;

          const finalP = !isNaN(pNum) && pNum >= 0 ? pNum : v.price;
          const finalM = !isNaN(mNum) && mNum >= 0 ? mNum : Math.round(finalP * 1.25);
          const finalS = !isNaN(sNum) && sNum >= 0 ? sNum : v.stock;

          if (finalP !== v.price || finalM !== v.mrp || finalS !== v.stock) {
            changed = true;
          }
          return { ...v, price: finalP, mrp: finalM, stock: finalS };
        });
        return changed ? { ...prod, variants: newVariants } : prod;
      });

      const res = await fetch("/api/admin/bulk-rates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ products: updatedProducts }),
      });
      const data = await res.json();
      if (res.ok && data.products) {
        setProducts(data.products);
        setStatusMsg("✓ All rates and inventory saved successfully.");
      } else {
        setStatusMsg(data.error || "Failed to save rates.");
      }
    } catch {
      setStatusMsg("Network error saving rates.");
    }
  };

  const handleSaveSingleVariantRate = async (product: Product, variantId: string) => {
    const draftP = priceDrafts[variantId];
    const draftM = mrpDrafts[variantId];
    const draftS = stockDrafts[variantId];

    const currentV = product.variants.find((v) => v.id === variantId);
    if (!currentV) return;

    const pNum = draftP !== undefined ? parseFloat(draftP) : currentV.price;
    const mNum = draftM !== undefined ? parseFloat(draftM) : currentV.mrp;
    const sNum = draftS !== undefined ? parseInt(draftS, 10) : currentV.stock;

    const finalP = !isNaN(pNum) && pNum >= 0 ? pNum : currentV.price;
    const finalM = !isNaN(mNum) && mNum >= 0 ? mNum : Math.round(finalP * 1.25);
    const finalS = !isNaN(sNum) && sNum >= 0 ? sNum : currentV.stock;

    const updatedVariants = product.variants.map((v) =>
      v.id === variantId ? { ...v, price: finalP, mrp: finalM, stock: finalS } : v
    );
    const updatedProd: Product = { ...product, variants: updatedVariants };

    try {
      const res = await fetch("/api/products", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedProd),
      });
      const data = await res.json();
      if (res.ok && data.products) {
        setProducts(data.products);
        setStatusMsg(`✓ Saved rate for "${product.name} (${currentV.label})"`);
      }
    } catch {
      setStatusMsg("Network error updating rate.");
    }
  };

  const handleBulkModifyStock = async () => {
    const amt = parseInt(bulkStockAmount, 10);
    if (isNaN(amt)) {
      alert("Please enter a valid stock number.");
      return;
    }
    const newStockDrafts = { ...stockDrafts };
    products.forEach((p) => {
      if (bulkStockCategory !== "all" && p.category !== bulkStockCategory) return;
      p.variants.forEach((v) => {
        let current = parseInt(newStockDrafts[v.id] || String(v.stock), 10);
        if (isNaN(current)) current = v.stock;
        if (bulkStockAction === "set_all") {
          newStockDrafts[v.id] = String(amt);
        } else if (bulkStockAction === "add_all") {
          newStockDrafts[v.id] = String(current + amt);
        } else if (bulkStockAction === "restock_low") {
          if (current < 15) newStockDrafts[v.id] = String(amt);
        } else if (bulkStockAction === "zero_out") {
          newStockDrafts[v.id] = "0";
        }
      });
    });
    setStockDrafts(newStockDrafts);
    setShowBulkStockModal(false);
    setStatusMsg(`Stock modified in drafts. Click "Save All Rates" to persist.`);
  };

  const handleAutoMrpAll = (multiplier = 1.25) => {
    const newDrafts = { ...mrpDrafts };
    products.forEach((p) => {
      p.variants.forEach((v) => {
        const pVal = parseFloat(priceDrafts[v.id] || String(v.price));
        if (!isNaN(pVal) && pVal > 0) {
          newDrafts[v.id] = String(Math.round(pVal * multiplier));
        }
      });
    });
    setMrpDrafts(newDrafts);
    setStatusMsg(`Calculated +${Math.round((multiplier - 1) * 100)}% MRP for all items. Click "Save All Rates" to persist.`);
  };

  const handleClearAllOrders = async () => {
    const confirmWipe = window.confirm(
      "DANGER: Are you absolutely sure you want to permanently delete ALL customer orders and reset sales history to zero?\n\nThis cannot be undone. Product catalog, inventory, and store settings will be preserved."
    );
    if (!confirmWipe) return;

    const enteredPin = window.prompt(
      "CONFIRMATION REQUIRED: Enter Admin PIN to execute database reset:",
      ""
    );
    if (!enteredPin) {
      setStatusMsg("Order reset cancelled.");
      return;
    }
    if (enteredPin.trim() !== pin && enteredPin.trim() !== "farhan2009") {
      setStatusMsg("❌ Incorrect PIN. Order reset rejected.");
      alert("Incorrect PIN. Access denied.");
      return;
    }
    setStatusMsg("Wiping all orders and resetting sales metrics to ₹0...");
    try {
      const res = await fetch(`/api/orders?all=1&pin=${encodeURIComponent(enteredPin.trim())}`, {
        method: "DELETE",
        headers: { "x-admin-pin": enteredPin.trim() },
      });
      const data = await res.json();
      if (res.ok) {
        setOrders([]);
        setStatusMsg("✓ All customer orders deleted. Sales history reset to ₹0.");
        alert("Success: All order records and sales history have been cleared. Order tracking is reset to zero.");
      } else {
        setStatusMsg(data.error || "Failed to clear orders.");
        alert(data.error || "Failed to clear orders.");
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
    const code = couponCode.trim().toUpperCase();
    const disc = parseInt(couponDiscount, 10);
    const minOrd = parseInt(couponMinOrder, 10);
    if (!code || isNaN(disc) || disc <= 0 || disc > 100) {
      alert("Please enter a valid coupon code and discount percentage between 1 and 100.");
      return;
    }
    setSavingCoupon(true);
    setStatusMsg(`Saving coupon ${code}...`);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          discountPercent: disc,
          minOrder: isNaN(minOrd) ? 0 : minOrd,
          description: couponDesc.trim() || `${disc}% OFF`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.coupons) {
        setCoupons(data.coupons);
        setCouponCode("");
        setCouponDesc("");
        setStatusMsg(`✓ Coupon ${code} saved and activated!`);
      } else {
        setStatusMsg(data.error || "Failed to save coupon.");
      }
    } catch {
      setStatusMsg("Network error saving coupon.");
    } finally {
      setSavingCoupon(false);
    }
  };

  const handleToggleCoupon = async (c: PromoCoupon) => {
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: c.code, active: !c.active }),
      });
      const data = await res.json();
      if (res.ok && data.coupons) {
        setCoupons(data.coupons);
        setStatusMsg(`✓ Coupon ${c.code} is now ${!c.active ? "Active" : "Inactive"}.`);
      }
    } catch {
      setStatusMsg("Network error toggling coupon.");
    }
  };

  const handleDeleteCoupon = async (code: string) => {
    if (!confirm(`Permanently delete coupon "${code}"?`)) return;
    try {
      const res = await fetch(`/api/admin/coupons?code=${encodeURIComponent(code)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (res.ok && data.coupons) {
        setCoupons(data.coupons);
        setStatusMsg(`✓ Coupon ${code} deleted.`);
      }
    } catch {
      setStatusMsg("Network error deleting coupon.");
    }
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatusMsg(`Uploading and parsing ${file.name}...`);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("mode", csvMode);
      const res = await fetch("/api/admin/import-csv", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.products) {
        setProducts(data.products);
        setStatusMsg(`✓ Import successful! ${data.message || `${data.products.length} products loaded.`}`);
      } else {
        setStatusMsg(data.error || "CSV Import failed.");
      }
    } catch {
      setStatusMsg("Network error during CSV upload.");
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    productSlug: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setStatusMsg(`Uploading image for ${productSlug}...`);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("slug", productSlug);
      const res = await fetch("/api/admin/upload-image", { method: "POST", body: fd });
      const data = await res.json();
      if (res.ok && data.url) {
        setProducts((prev) =>
          prev.map((p) => (p.slug === productSlug ? { ...p, image: data.url } : p))
        );
        setStatusMsg(`✓ Image uploaded successfully for ${productSlug}`);
      } else {
        setStatusMsg(data.error || "Image upload failed.");
      }
    } catch {
      setStatusMsg("Network error during image upload.");
    }
  };

  const handleExportCsv = () => {
    const rows: string[][] = [
      ["Category", "Product Name", "Pack Size", "Price", "MRP", "Stock", "SKU", "Description", "Image"],
    ];
    products.forEach((p) => {
      p.variants.forEach((v) => {
        rows.push([
          p.category,
          `"${p.name.replace(/"/g, '""')}"`,
          `"${v.label.replace(/"/g, '""')}"`,
          String(v.price),
          String(v.mrp || Math.round(v.price * 1.25)),
          String(v.stock),
          `"${v.sku || ""}"`,
          `"${(p.description || "").replace(/"/g, '""')}"`,
          `"${p.image || ""}"`,
        ]);
      });
    });
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `evoka-catalog-export-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setStatusMsg("✓ Catalog exported to CSV.");
  };

  const handleExportSalesReportCsv = () => {
    const rows: string[][] = [
      ["Date", "Channel", "Order ID", "Bill Number", "Customer Name", "Phone", "Status", "Payment Method", "Payment Status", "Items Summary", "Subtotal", "Discount", "Delivery Fee", "Grand Total"],
    ];
    reportOrders.forEach((o) => {
      const itemsSummary = o.items.map((it) => `${it.name} (${it.variantLabel}) x${it.quantity}`).join("; ");
      rows.push([
        `"${new Date(o.createdAt).toLocaleString("en-IN")}"`,
        o.channel === "offline" ? "OFFLINE POS" : "ONLINE WEB",
        `"${o.id}"`,
        `"${o.offlineBillNumber || ""}"`,
        `"${o.customerName.replace(/"/g, '""')}"`,
        `"${o.phone}"`,
        `"${o.status}"`,
        `"${o.paymentMethod}"`,
        `"${o.paymentStatus}"`,
        `"${itemsSummary.replace(/"/g, '""')}"`,
        String(o.subtotal),
        String(o.discount || 0),
        String(o.shippingFee || 0),
        String(o.total),
      ]);
    });
    const csvContent = "data:text/csv;charset=utf-8," + rows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `evoka-sales-report-${reportRange}-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setStatusMsg("✓ Sales report exported to CSV.");
  };

  // POS Add item to cart
  const handleAddPosItem = () => {
    if (!posSelectedProductId || !posSelectedVariantId) {
      alert("Please select a product and pack size.");
      return;
    }
    const product = products.find((p) => p.id === posSelectedProductId);
    if (!product) return;
    const variant = product.variants.find((v) => v.id === posSelectedVariantId);
    if (!variant) return;

    const qty = Math.max(1, posSelectedQty);
    if (variant.stock < qty) {
      alert(`Only ${variant.stock} units available in stock for ${product.name} (${variant.label}).`);
      return;
    }

    setPosItems((prev) => {
      const idx = prev.findIndex((it) => it.productId === product.id && it.variantId === variant.id);
      if (idx >= 0) {
        const updated = [...prev];
        const newQty = updated[idx].quantity + qty;
        if (variant.stock < newQty) {
          alert(`Cannot add more. Available stock is ${variant.stock}.`);
          return prev;
        }
        updated[idx].quantity = newQty;
        return updated;
      }
      return [
        ...prev,
        {
          productId: product.id,
          variantId: variant.id,
          name: product.name,
          variantLabel: variant.label,
          price: variant.price,
          mrp: variant.mrp,
          stock: variant.stock,
          quantity: qty,
        },
      ];
    });
    setPosSelectedQty(1);
  };

  const handleCreateOfflineBill = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (posItems.length === 0) {
      alert("Please add at least one product item to create the bill.");
      return;
    }
    setSubmittingPosOrder(true);
    setStatusMsg("Creating offline bill and deducting live inventory...");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          channel: "offline",
          customerName: posCustomerName.trim() || "Walk-in Customer",
          phone: posCustomerPhone.trim() || "9999999999",
          paymentMethod: posPaymentMethod,
          notes: posNotes.trim(),
          discount: posDiscount,
          deliveryFee: posDeliveryFee,
          items: posItems.map((it) => ({
            productId: it.productId,
            variantId: it.variantId,
            quantity: it.quantity,
            price: it.price,
          })),
        }),
      });
      const data = await res.json();
      if (res.ok && data.order) {
        setOrders((prev) => [data.order, ...prev]);
        // Update local stock counts
        setProducts((prev) =>
          prev.map((p) => {
            const matches = posItems.filter((it) => it.productId === p.id);
            if (matches.length === 0) return p;
            return {
              ...p,
              variants: p.variants.map((v) => {
                const match = matches.find((it) => it.variantId === v.id);
                if (!match) return v;
                return { ...v, stock: Math.max(0, v.stock - match.quantity) };
              }),
            };
          })
        );
        // Clear POS cart
        setPosItems([]);
        setPosCustomerName("");
        setPosCustomerPhone("");
        setPosDiscount(0);
        setPosDeliveryFee(0);
        setPosNotes("");
        setStatusMsg(`✓ Offline Bill ${data.order.offlineBillNumber || data.order.id} generated!`);
        // Instant print invoice
        handlePrintInvoicePdf(data.order);
      } else {
        alert(data.error || "Failed to create offline bill.");
        setStatusMsg(data.error || "Failed to create offline bill.");
      }
    } catch {
      alert("Network error creating offline bill.");
      setStatusMsg("Network error creating offline bill.");
    } finally {
      setSubmittingPosOrder(false);
    }
  };

  // Metrics Calculations
  const onlineOrders = useMemo(() => orders.filter((o) => o.channel !== "offline"), [orders]);
  const offlineBills = useMemo(() => orders.filter((o) => o.channel === "offline"), [orders]);

  const activeOrders = useMemo(() => orders.filter((o) => o.status !== "Cancelled"), [orders]);
  const onlineActiveOrders = useMemo(() => onlineOrders.filter((o) => o.status !== "Cancelled"), [onlineOrders]);
  const offlineActiveOrders = useMemo(() => offlineBills.filter((o) => o.status !== "Cancelled"), [offlineBills]);

  const onlineRevenue = useMemo(() => onlineActiveOrders.reduce((sum, o) => sum + o.total, 0), [onlineActiveOrders]);
  const offlineRevenue = useMemo(() => offlineActiveOrders.reduce((sum, o) => sum + o.total, 0), [offlineActiveOrders]);
  const totalCombinedRevenue = onlineRevenue + offlineRevenue;

  const awaitingOrders = useMemo(
    () => orders.filter((o) => o.status === "Pending" || o.status === "PENDING_CONFIRMATION"),
    [orders]
  );
  const undeliveredOrders = useMemo(
    () => orders.filter((o) => ["Confirmed", "Packed", "Shipped"].includes(o.status)),
    [orders]
  );
  const deliveredOrders = useMemo(() => orders.filter((o) => o.status === "Delivered"), [orders]);
  const paidOrders = useMemo(
    () => orders.filter((o) => o.status !== "Cancelled" && (o.paymentStatus === "PAID" || o.paymentStatus === "Paid")),
    [orders]
  );
  const unpaidOrders = useMemo(
    () => orders.filter((o) => o.status !== "Cancelled" && o.paymentStatus !== "PAID" && o.paymentStatus !== "Paid"),
    [orders]
  );
  const cancelledOrders = useMemo(() => orders.filter((o) => o.status === "Cancelled"), [orders]);

  const awaitingCount = awaitingOrders.length;
  const undeliveredCount = undeliveredOrders.length;
  const deliveredCount = deliveredOrders.length;
  const paidCount = paidOrders.length;
  const unpaidCount = unpaidOrders.length;
  const cancelledCount = cancelledOrders.length;

  const upiSales = useMemo(
    () => activeOrders.filter((o) => o.paymentMethod === "upi").reduce((sum, o) => sum + o.total, 0),
    [activeOrders]
  );
  const codCashSales = useMemo(
    () => activeOrders.filter((o) => o.paymentMethod !== "upi").reduce((sum, o) => sum + o.total, 0),
    [activeOrders]
  );
  const aov = activeOrders.length > 0 ? Math.round(totalCombinedRevenue / activeOrders.length) : 0;

  const totalVariants = useMemo(
    () => products.reduce((acc, p) => acc + p.variants.length, 0),
    [products]
  );
  const lowStockCount = useMemo(
    () => products.reduce((acc, p) => acc + p.variants.filter((v) => v.stock < 15).length, 0),
    [products]
  );
  const outOfStockCount = useMemo(
    () => products.reduce((acc, p) => acc + p.variants.filter((v) => v.stock === 0).length, 0),
    [products]
  );

  // Orders Tab Filtered List
  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    const now = new Date();

    return orders.filter((o) => {
      // Channel filter
      if (orderChannelFilter === "online" && o.channel === "offline") return false;
      if (orderChannelFilter === "offline" && o.channel !== "offline") return false;

      // Date range filter
      if (orderDateRange === "today") {
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        if (new Date(o.createdAt).getTime() < todayStart) return false;
      } else if (orderDateRange === "yesterday") {
        const yStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).getTime();
        const yEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        const t = new Date(o.createdAt).getTime();
        if (t < yStart || t >= yEnd) return false;
      } else if (orderDateRange === "7days") {
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
        if (new Date(o.createdAt).getTime() < weekStart) return false;
      } else if (orderDateRange === "month") {
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        if (new Date(o.createdAt).getTime() < monthStart) return false;
      }

      // Status filter
      if (orderFilter !== "All" && o.status !== orderFilter) return false;

      // Payment filter
      if (orderPaymentView === "upi" && o.paymentMethod !== "upi") return false;
      if (orderPaymentView === "cod" && (o.paymentMethod === "upi" || o.paymentMethod === "card")) return false;

      if (!q) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        (o.offlineBillNumber || "").toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.phone.toLowerCase().includes(q) ||
        (o.address?.city || "").toLowerCase().includes(q) ||
        (o.upiReference || "").toLowerCase().includes(q)
      );
    });
  }, [orders, orderChannelFilter, orderDateRange, orderFilter, orderPaymentView, orderSearch]);

  // Customers Directory aggregation
  const customers = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        phone: string;
        orderCount: number;
        totalSpent: number;
        lastOrderDate: string;
        cities: Set<string>;
        channels: Set<string>;
      }
    >();

    for (const o of orders) {
      if (o.status === "Cancelled") continue;
      const cleanPhone = o.phone ? o.phone.replace(/\D/g, "").slice(-10) : "";
      if (!cleanPhone || cleanPhone === "9999999999") {
        if (!o.customerName || o.customerName === "Walk-in Customer") continue;
      }
      const key = cleanPhone || o.customerName;
      const existing = map.get(key);
      const total = o.total || 0;
      const city = o.address?.city || "Direct Counter";
      const channel = o.channel === "offline" ? "In-Store POS" : "Online Web";

      if (!existing) {
        map.set(key, {
          name: o.customerName || "Customer",
          phone: cleanPhone,
          orderCount: 1,
          totalSpent: total,
          lastOrderDate: o.createdAt,
          cities: new Set([city]),
          channels: new Set([channel]),
        });
      } else {
        existing.orderCount += 1;
        existing.totalSpent += total;
        if (new Date(o.createdAt) > new Date(existing.lastOrderDate)) {
          existing.lastOrderDate = o.createdAt;
          if (o.customerName && o.customerName !== "Walk-in Customer") {
            existing.name = o.customerName;
          }
        }
        existing.cities.add(city);
        existing.channels.add(channel);
      }
    }

    return Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [orders]);

  const filteredCustomers = useMemo(() => {
    const q = customerSearch.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        Array.from(c.cities).some((city) => city.toLowerCase().includes(q))
    );
  }, [customers, customerSearch]);

  // Filtered Offline Bills
  const filteredOfflineBills = useMemo(() => {
    const q = offlineSearch.trim().toLowerCase();
    if (!q) return offlineBills;
    return offlineBills.filter(
      (b) =>
        b.id.toLowerCase().includes(q) ||
        (b.offlineBillNumber || "").toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.phone.toLowerCase().includes(q)
      );
  }, [offlineBills, offlineSearch]);

  // Defined Sales Report Analytics
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
  const reportOnlineOrders = useMemo(() => reportActiveOrders.filter((o) => o.channel !== "offline"), [reportActiveOrders]);
  const reportOfflineOrders = useMemo(() => reportActiveOrders.filter((o) => o.channel === "offline"), [reportActiveOrders]);
  const reportOnlineSales = useMemo(() => reportOnlineOrders.reduce((sum, o) => sum + o.total, 0), [reportOnlineOrders]);
  const reportOfflineSales = useMemo(() => reportOfflineOrders.reduce((sum, o) => sum + o.total, 0), [reportOfflineOrders]);
  const reportNetSales = useMemo(() => reportActiveOrders.reduce((sum, o) => sum + o.total, 0), [reportActiveOrders]);
  const reportAov = reportActiveOrders.length > 0 ? Math.round(reportNetSales / reportActiveOrders.length) : 0;

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

  const posSubtotal = useMemo(
    () => posItems.reduce((sum, it) => sum + it.price * it.quantity, 0),
    [posItems]
  );
  const posTotal = Math.max(0, posSubtotal - posDiscount + posDeliveryFee);

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-oat flex items-center justify-center p-6 text-charcoal">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <div className="w-4 h-4 border-2 border-sage border-t-transparent rounded-full animate-spin" />
          Verifying Admin Access...
        </div>
      </div>
    );
  }

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-oat flex items-center justify-center p-6">
        <form
          onSubmit={handleLogin}
          className="bg-white rounded-3xl border border-sand p-8 max-w-sm w-full space-y-4 shadow-sm"
        >
          <div className="w-12 h-12 rounded-2xl bg-mint-light flex items-center justify-center text-sage mx-auto">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="text-center">
            <h1 className="font-editorial text-2xl font-bold text-charcoal">EVOKA Admin Console</h1>
            <p className="text-xs text-muted mt-1">Enter your 4-8 digit administrator PIN</p>
          </div>
          <input
            type="password"
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Admin PIN"
            className="w-full px-4 py-2.5 rounded-xl bg-cream border border-sand text-center text-lg tracking-widest font-mono focus:outline-none focus:border-sage"
          />
          {authError && <p className="text-xs text-red-600 font-medium text-center">{authError}</p>}
          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-sage hover:bg-sage-dark text-cream text-sm font-semibold transition cursor-pointer"
          >
            Unlock Console
          </button>
        </form>
      </div>
    );
  }

  const renderCompactOrderCard = (order: Order) => {
    const draft = trackingDrafts[order.id] || { courierName: "", trackingNumber: "" };
    const invoiceCheck = checkInvoiceEligibility(order);
    const isUpi = order.paymentMethod === "upi";
    const isOffline = order.channel === "offline";
    const isDelivered = order.status === "Delivered";
    const isCancelled = order.status === "Cancelled";
    const isUndelivered = ["Confirmed", "Packed", "Shipped"].includes(order.status);
    const isAwaiting = !isCancelled && !isDelivered && !isUndelivered;
    const isPaid = order.paymentStatus === "PAID" || order.paymentStatus === "Paid";
    const isExpanded = !!expandedOrders[order.id];

    return (
      <div
        key={order.id}
        className={`bg-white rounded-2xl border transition-all shadow-xs overflow-hidden ${
          isCancelled
            ? "border-red-200 opacity-80"
            : isDelivered
            ? "border-emerald-200"
            : isUndelivered
            ? "border-blue-200"
            : "border-amber-200"
        }`}
      >
        {/* Compact Header Row (Always Visible) */}
        <div className="p-4 flex flex-wrap items-center justify-between gap-3 bg-white hover:bg-oat/30 transition-colors">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-sm text-charcoal font-mono">
              {isOffline && order.offlineBillNumber ? order.offlineBillNumber : order.id}
            </span>

            {/* Channel Badge */}
            {isOffline ? (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 font-extrabold uppercase">
                OFFLINE POS
              </span>
            ) : (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-sky-100 text-sky-900 border border-sky-300 font-extrabold uppercase">
                ONLINE WEB
              </span>
            )}

            {/* Payment Method Badge */}
            <span className="text-[10px] px-2 py-0.5 rounded-md bg-oat text-charcoal font-bold uppercase">
              {isUpi ? "UPI" : order.paymentMethod.toUpperCase()}
            </span>

            {/* Delivery Status Badge */}
            {isDelivered ? (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> DELIVERED
              </span>
            ) : isUndelivered ? (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-blue-100 text-blue-900 border border-blue-300 inline-flex items-center gap-1">
                <Truck className="w-3 h-3 text-blue-600" /> {order.status.toUpperCase()}
              </span>
            ) : isCancelled ? (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-red-100 text-red-800 border border-red-300 inline-flex items-center gap-1">
                <XCircle className="w-3 h-3 text-red-600" /> CANCELLED
              </span>
            ) : (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                🔔 AWAITING CONFIRMATION
              </span>
            )}

            {/* Payment Status Badge */}
            {isPaid ? (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 inline-flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-600" /> PAID
              </span>
            ) : order.paymentStatus === "REJECTED" ? (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-red-100 text-red-800 border border-red-300 inline-flex items-center gap-1">
                ✕ REJECTED
              </span>
            ) : order.paymentStatus === "PAYMENT_UNDER_REVIEW" ? (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-900 border border-amber-300 inline-flex items-center gap-1">
                ⏳ UPI REVIEW
              </span>
            ) : (
              <span className="text-[11px] px-2.5 py-0.5 rounded-full font-bold bg-purple-100 text-purple-900 border border-purple-300 inline-flex items-center gap-1">
                ⏳ UNPAID
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="text-right">
              <span className="text-base font-bold text-charcoal">₹{order.total}</span>
              <span className="text-[11px] text-muted ml-2">
                {new Date(order.createdAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                })}{" "}
                {new Date(order.createdAt).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: true,
                })}
              </span>
            </div>

            {/* Quick Actions */}
            {isAwaiting && (
              <button
                type="button"
                onClick={() => handleConfirmOrder(order.id)}
                className="px-3 py-1 rounded-lg bg-[#184D3B] hover:bg-[#12382B] text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <CheckCircle2 className="w-3 h-3 text-emerald-300" /> Confirm
              </button>
            )}

            {order.phone && order.phone !== "9999999999" && (
              <a
                href={`https://wa.me/91${order.phone.replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(
                  `Hello ${order.customerName}, this is EVOKA regarding your order ${order.id}.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg border border-sand bg-oat hover:bg-sand text-charcoal inline-flex items-center"
                title="WhatsApp Customer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#184D3B]" />
              </a>
            )}

            {/* Expand / Collapse Button */}
            <button
              type="button"
              onClick={() =>
                setExpandedOrders((prev) => ({ ...prev, [order.id]: !prev[order.id] }))
              }
              className="px-3 py-1 rounded-lg border border-sand bg-oat hover:bg-sand text-xs font-semibold text-charcoal inline-flex items-center gap-1 cursor-pointer"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5 text-sage" /> Less
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-sage" /> Details
                </>
              )}
            </button>
          </div>
        </div>

        {/* Customer & Items Summary Line */}
        <div className="px-4 pb-3 flex flex-wrap items-center justify-between text-xs text-muted border-b border-sand/40 gap-2">
          <div>
            <strong className="text-charcoal font-semibold">{order.customerName}</strong>
            {order.phone && order.phone !== "9999999999" && <span> — {order.phone}</span>}
            <span className="text-charcoal/70 ml-2">
              ({order.items.length} {order.items.length === 1 ? "item" : "items"}:{" "}
              {order.items.map((i) => `${i.name} ×${i.quantity}`).join(", ")})
            </span>
          </div>
          <div>
            {order.fulfillmentType === "pickup" ? (
              <span className="text-amber-800 font-medium">Pickup: {order.pickupOutlet}</span>
            ) : (
              <span>Delivery: {order.address.city || "Thiruvananthapuram"}</span>
            )}
          </div>
        </div>

        {/* Expanded Detailed View */}
        {isExpanded && (
          <div className="p-5 bg-oat/20 space-y-5 border-t border-sand">
            {/* Address & Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-white p-3.5 rounded-xl border border-sand space-y-1">
                <p className="font-bold text-charcoal uppercase tracking-wider text-[10px]">
                  Fulfillment &amp; Customer
                </p>
                <p className="font-semibold text-charcoal">{order.customerName}</p>
                <p className="text-muted">Mobile: {order.phone}</p>
                {order.email && <p className="text-muted">Email: {order.email}</p>}
                <p className="text-charcoal pt-1">
                  {order.fulfillmentType === "pickup"
                    ? `Store Pickup: ${order.pickupOutlet}`
                    : `Address: ${order.address.line1}, ${order.address.landmark ? `${order.address.landmark}, ` : ""}${order.address.city}, ${order.address.state} - ${order.address.pincode}`}
                </p>
                {order.notes && (
                  <p className="text-clay font-medium pt-1">Customer Note: {order.notes}</p>
                )}
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-sand space-y-1.5">
                <p className="font-bold text-charcoal uppercase tracking-wider text-[10px]">
                  Payment &amp; Financials
                </p>
                <p>
                  Method: <strong>{order.paymentMethod.toUpperCase()}</strong> | Status:{" "}
                  <strong>{order.paymentStatus}</strong>
                </p>
                {order.upiReference && (
                  <p className="font-mono text-[#184D3B] font-bold">
                    UPI Reference / UTR: {order.upiReference}
                  </p>
                )}
                {order.paymentRejectedReason && (
                  <p className="text-red-600 font-semibold">
                    Rejection Reason: {order.paymentRejectedReason}
                  </p>
                )}
                <div className="text-[11px] text-muted pt-1 space-y-0.5 border-t border-sand/50">
                  <p>Subtotal: ₹{order.subtotal}</p>
                  {order.discount ? <p>Discount: -₹{order.discount}</p> : null}
                  <p>Delivery Fee: ₹{order.shippingFee || 0}</p>
                  <p className="font-bold text-charcoal text-xs">Final Total: ₹{order.total}</p>
                </div>
              </div>
            </div>

            {/* UPI Screenshot Review */}
            {order.paymentScreenshot && (
              <div className="bg-white p-4 rounded-xl border border-sand flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setPreviewScreenshotUrl(order.paymentScreenshot || null)}
                    className="w-14 h-14 rounded-lg overflow-hidden border border-sand relative group cursor-pointer shrink-0"
                  >
                    <img
                      src={order.paymentScreenshot}
                      alt="UPI Payment Proof"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <Eye className="w-4 h-4 text-white" />
                    </div>
                  </button>
                  <div className="text-xs">
                    <p className="font-bold text-charcoal">UPI Payment Proof Screenshot</p>
                    <p className="text-muted text-[11px]">Click thumbnail to inspect full receipt.</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => updateOrder(order.id, { adminAction: "approve_payment" })}
                    className="px-3 py-1.5 rounded-lg bg-[#184D3B] text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" /> Approve Paid
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const reason = window.prompt("Reason for rejecting UPI payment proof:", "Screenshot blurred / invalid UTR");
                      if (reason !== null) {
                        updateOrder(order.id, {
                          adminAction: "reject_payment",
                          paymentRejectedReason: reason.trim() || "Payment proof could not be verified",
                        });
                      }
                    }}
                    className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" /> Reject
                  </button>
                </div>
              </div>
            )}

            {/* Order Items Table */}
            <div className="bg-white rounded-xl border border-sand overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-oat/70 text-charcoal border-b border-sand uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-4 py-2.5">Item</th>
                    <th className="px-4 py-2.5">Variant</th>
                    <th className="px-4 py-2.5 text-right">Unit MRP</th>
                    <th className="px-4 py-2.5 text-right">Selling Price</th>
                    <th className="px-4 py-2.5 text-center">Qty</th>
                    <th className="px-4 py-2.5 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand/50">
                  {order.items.map((it, idx) => (
                    <tr key={idx} className="hover:bg-oat/20">
                      <td className="px-4 py-2.5 font-semibold text-charcoal">{it.name}</td>
                      <td className="px-4 py-2.5 text-muted">{it.variantLabel}</td>
                      <td className="px-4 py-2.5 text-right text-muted line-through">₹{it.mrp || Math.round(it.price * 1.25)}</td>
                      <td className="px-4 py-2.5 text-right font-medium text-charcoal">₹{it.price}</td>
                      <td className="px-4 py-2.5 text-center font-bold">{it.quantity}</td>
                      <td className="px-4 py-2.5 text-right font-bold text-charcoal">₹{it.price * it.quantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Order Status & Courier Tracking Controls */}
            <div className="bg-white p-4 rounded-xl border border-sand space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-charcoal">Update Order Status:</span>
                  <select
                    value={order.status}
                    onChange={(e) => updateOrder(order.id, { status: e.target.value as OrderStatus })}
                    className="px-3 py-1.5 rounded-lg bg-oat border border-sand text-xs font-bold text-charcoal cursor-pointer"
                  >
                    {ORDER_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>

                  <span className="text-xs font-bold text-charcoal ml-2">Payment:</span>
                  <select
                    value={order.paymentStatus}
                    onChange={(e) => updateOrder(order.id, { paymentStatus: e.target.value as PaymentStatus })}
                    className="px-3 py-1.5 rounded-lg bg-oat border border-sand text-xs font-bold text-charcoal cursor-pointer"
                  >
                    {PAYMENT_STATUSES.map((ps) => (
                      <option key={ps} value={ps}>
                        {ps}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 1-Click Status Transitions */}
                <div className="flex flex-wrap items-center gap-1.5">
                  {!isDelivered && !isCancelled && (
                    <button
                      type="button"
                      onClick={() => updateOrder(order.id, { status: "Delivered" })}
                      className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Truck className="w-3.5 h-3.5" /> Mark Delivered
                    </button>
                  )}
                  {!isPaid && !isCancelled && (
                    <button
                      type="button"
                      onClick={() => updateOrder(order.id, { paymentStatus: "PAID" })}
                      className="px-3 py-1 rounded-lg bg-[#184D3B] hover:bg-[#12382B] text-white text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" /> Mark Paid
                    </button>
                  )}
                </div>
              </div>

              {/* Courier Tracking Draft */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t border-sand/60">
                <input
                  type="text"
                  value={draft.courierName}
                  onChange={(e) =>
                    setTrackingDrafts((prev) => ({
                      ...prev,
                      [order.id]: { ...draft, courierName: e.target.value },
                    }))
                  }
                  placeholder={order.courierName || "Courier Partner (e.g. DTDC)"}
                  className="px-3 py-1.5 rounded-lg bg-cream border border-sand text-xs"
                />
                <input
                  type="text"
                  value={draft.trackingNumber}
                  onChange={(e) =>
                    setTrackingDrafts((prev) => ({
                      ...prev,
                      [order.id]: { ...draft, trackingNumber: e.target.value },
                    }))
                  }
                  placeholder={order.trackingNumber || "AWB / Tracking Number"}
                  className="px-3 py-1.5 rounded-lg bg-cream border border-sand text-xs"
                />
                <button
                  type="button"
                  onClick={() => {
                    updateOrder(order.id, {
                      courierName: draft.courierName || order.courierName,
                      trackingNumber: draft.trackingNumber || order.trackingNumber,
                      status: order.status === "Pending" || order.status === "Confirmed" ? "Shipped" : order.status,
                    });
                  }}
                  className="px-3 py-1.5 rounded-lg bg-oat hover:bg-sand border border-sand text-xs font-bold text-charcoal inline-flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5 text-sage" /> Save Courier Info
                </button>
              </div>
            </div>

            {/* Invoice & Danger Actions Bar */}
            <div className="p-3.5 rounded-xl bg-white border border-sand flex flex-wrap items-center justify-between gap-3">
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
                  <span className="text-charcoal font-medium">Eligible for PDF Invoice</span>
                ) : (
                  <span className="text-muted">{invoiceCheck.reason}</span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => handlePrintInvoicePdf(order)}
                  className="px-3 py-1.5 rounded-lg bg-white border border-sand hover:border-sage text-xs font-semibold text-charcoal inline-flex items-center gap-1 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5 text-sage" /> Print / Save Invoice PDF
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteSingleOrder(order.id)}
                  className="px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete Order
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-oat p-4 md:p-8 space-y-6 max-w-7xl mx-auto text-charcoal font-sans">
      {/* Top Console Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white rounded-3xl border border-sand p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-sage">
              Live Operations Console
            </span>
          </div>
          <h1 className="font-editorial text-2xl md:text-3xl font-bold text-charcoal mt-0.5">
            EVOKA Administrative Dashboard
          </h1>
          <p className="text-xs text-muted">
            Natural Homecare • Isolated Customer Histories • Unified Online &amp; POS Billing
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {statusMsg && (
            <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-mint-light text-sage border border-sage/30">
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

      {/* Main 8 Tabs Navigation */}
      <div className="flex flex-wrap gap-2 border-b border-sand pb-3">
        <button
          type="button"
          onClick={() => setTab("dashboard")}
          className={`px-4 py-2.5 rounded-full text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-all ${
            tab === "dashboard"
              ? "bg-[#184D3B] text-white shadow-sm"
              : "bg-white border border-sand text-charcoal hover:border-sage"
          }`}
        >
          <LayoutDashboard className="w-4 h-4" /> Dashboard
        </button>

        <button
          type="button"
          onClick={() => setTab("orders")}
          className={`px-4 py-2.5 rounded-full text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-all ${
            tab === "orders"
              ? "bg-[#184D3B] text-white shadow-sm"
              : "bg-white border border-sand text-charcoal hover:border-sage"
          }`}
        >
          <ShoppingBag className="w-4 h-4" /> Orders ({orders.length})
          {awaitingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-400 text-charcoal text-[10px] font-bold">
              {awaitingCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setTab("inventory")}
          className={`px-4 py-2.5 rounded-full text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-all ${
            tab === "inventory"
              ? "bg-[#184D3B] text-white shadow-sm"
              : "bg-white border border-sand text-charcoal hover:border-sage"
          }`}
        >
          <Boxes className="w-4 h-4 text-champagne" /> Inventory &amp; Rates ({totalVariants})
          {lowStockCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold">
              {lowStockCount} low
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setTab("products")}
          className={`px-4 py-2.5 rounded-full text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-all ${
            tab === "products"
              ? "bg-[#184D3B] text-white shadow-sm"
              : "bg-white border border-sand text-charcoal hover:border-sage"
          }`}
        >
          <Package className="w-4 h-4" /> Products ({products.length})
        </button>

        <button
          type="button"
          onClick={() => setTab("customers")}
          className={`px-4 py-2.5 rounded-full text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-all ${
            tab === "customers"
              ? "bg-[#184D3B] text-white shadow-sm"
              : "bg-white border border-sand text-charcoal hover:border-sage"
          }`}
        >
          <Users className="w-4 h-4" /> Customers ({customers.length})
        </button>

        <button
          type="button"
          onClick={() => setTab("offline")}
          className={`px-4 py-2.5 rounded-full text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-all ${
            tab === "offline"
              ? "bg-[#184D3B] text-white shadow-sm"
              : "bg-white border border-sand text-charcoal hover:border-sage"
          }`}
        >
          <Receipt className="w-4 h-4 text-amber-600" /> Offline Sales &amp; POS ({offlineBills.length})
        </button>

        <button
          type="button"
          onClick={() => setTab("reports")}
          className={`px-4 py-2.5 rounded-full text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-all ${
            tab === "reports"
              ? "bg-[#184D3B] text-white shadow-sm"
              : "bg-white border border-sand text-charcoal hover:border-sage"
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Sales Reports
        </button>

        <button
          type="button"
          onClick={() => setTab("settings")}
          className={`px-4 py-2.5 rounded-full text-xs font-bold inline-flex items-center gap-2 cursor-pointer transition-all ${
            tab === "settings"
              ? "bg-[#184D3B] text-white shadow-sm"
              : "bg-white border border-sand text-charcoal hover:border-sage"
          }`}
        >
          <Settings className="w-4 h-4" /> Settings
        </button>
      </div>

      {/* ============================================================== */}
      {/* 1. TAB: DASHBOARD OVERVIEW                                     */}
      {/* ============================================================== */}
      {tab === "dashboard" && (
        <div className="space-y-6">
          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Revenue */}
            <div className="bg-white rounded-2xl border border-sand p-5 space-y-1">
              <p className="text-[11px] text-muted uppercase font-bold tracking-wider">
                Combined Net Sales
              </p>
              <p className="text-2xl md:text-3xl font-bold text-charcoal">
                ₹{totalCombinedRevenue.toLocaleString("en-IN")}
              </p>
              <div className="text-[11px] text-muted space-y-0.5 pt-1 border-t border-sand/40">
                <p>Online: <strong>₹{onlineRevenue.toLocaleString("en-IN")}</strong></p>
                <p>Offline POS: <strong>₹{offlineRevenue.toLocaleString("en-IN")}</strong></p>
              </div>
            </div>

            {/* Total Orders */}
            <div className="bg-white rounded-2xl border border-sand p-5 space-y-1">
              <p className="text-[11px] text-muted uppercase font-bold tracking-wider">
                Total Transactions
              </p>
              <p className="text-2xl md:text-3xl font-bold text-charcoal">{orders.length}</p>
              <div className="text-[11px] text-muted space-y-0.5 pt-1 border-t border-sand/40">
                <p>Online Web: <strong>{onlineOrders.length}</strong> orders</p>
                <p>Offline Counter: <strong>{offlineBills.length}</strong> bills</p>
              </div>
            </div>

            {/* Action Required */}
            <div className="bg-white rounded-2xl border border-sand p-5 space-y-1">
              <p className="text-[11px] text-amber-700 uppercase font-bold tracking-wider">
                Pending Actions
              </p>
              <p className="text-2xl md:text-3xl font-bold text-amber-700">{awaitingCount}</p>
              <div className="text-[11px] text-muted space-y-0.5 pt-1 border-t border-sand/40">
                <p>Awaiting Confirm: <strong>{awaitingCount}</strong></p>
                <p>Pending Delivery: <strong>{undeliveredCount}</strong></p>
              </div>
            </div>

            {/* Inventory Health */}
            <div className="bg-white rounded-2xl border border-sand p-5 space-y-1">
              <p className="text-[11px] text-muted uppercase font-bold tracking-wider">
                Inventory Alerts
              </p>
              <p className="text-2xl md:text-3xl font-bold text-charcoal">{lowStockCount}</p>
              <div className="text-[11px] text-muted space-y-0.5 pt-1 border-t border-sand/40">
                <p>Low Stock (&lt;15): <strong>{lowStockCount}</strong></p>
                <p>Out of Stock: <strong>{outOfStockCount}</strong></p>
              </div>
            </div>

            {/* Sales Performance */}
            <div className="bg-white rounded-2xl border border-sand p-5 space-y-1 col-span-2 lg:col-span-1">
              <p className="text-[11px] text-muted uppercase font-bold tracking-wider">
                Performance / AOV
              </p>
              <p className="text-2xl md:text-3xl font-bold text-[#184D3B]">₹{aov}</p>
              <div className="text-[11px] text-muted space-y-0.5 pt-1 border-t border-sand/40">
                <p>UPI Sales: <strong>₹{upiSales}</strong></p>
                <p>COD/Cash: <strong>₹{codCashSales}</strong></p>
              </div>
            </div>
          </div>

          {/* Quick Action Bar */}
          <div className="bg-white rounded-3xl border border-sand p-6 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-charcoal">Quick Operational Actions</h3>
              <p className="text-xs text-muted">Jump straight to frequent tasks without scrolling.</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setTab("offline")}
                className="px-4 py-2 rounded-xl bg-[#184D3B] hover:bg-[#12382B] text-white text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Receipt className="w-3.5 h-3.5 text-champagne" /> + New Offline Bill
              </button>
              <button
                type="button"
                onClick={() => setTab("orders")}
                className="px-4 py-2 rounded-xl bg-oat hover:bg-sand border border-sand text-charcoal text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-sage" /> Manage Orders ({orders.length})
              </button>
              <button
                type="button"
                onClick={() => setTab("inventory")}
                className="px-4 py-2 rounded-xl bg-oat hover:bg-sand border border-sand text-charcoal text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Boxes className="w-3.5 h-3.5 text-sage" /> Rates &amp; Inventory
              </button>
              <button
                type="button"
                onClick={() => setTab("products")}
                className="px-4 py-2 rounded-xl bg-oat hover:bg-sand border border-sand text-charcoal text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-sage" /> Add Product
              </button>
              <a
                href="/api/admin/catalogue-pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-xl bg-oat hover:bg-sand border border-sand text-charcoal text-xs font-bold inline-flex items-center gap-1.5"
              >
                <FileText className="w-3.5 h-3.5 text-sage" /> Live Catalogue PDF
              </a>
            </div>
          </div>

          {/* Two-Column Widgets: Recent Transactions & Low Stock Alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Recent Transactions Widget */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-sand p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-charcoal flex items-center gap-2">
                    <Clock className="w-4 h-4 text-sage" /> Recent Transactions
                  </h3>
                  <p className="text-xs text-muted">Latest 6 orders and offline bills.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setTab("orders")}
                  className="text-xs font-bold text-sage hover:underline cursor-pointer"
                >
                  View All Orders &rarr;
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-8 text-muted text-xs">
                  No orders recorded yet. Start by creating an offline bill or receiving an online order.
                </div>
              ) : (
                <div className="divide-y divide-sand/50">
                  {orders.slice(0, 6).map((ord) => (
                    <div key={ord.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-charcoal">
                            {ord.channel === "offline" && ord.offlineBillNumber ? ord.offlineBillNumber : ord.id}
                          </span>
                          <span
                            className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase ${
                              ord.channel === "offline" ? "bg-amber-100 text-amber-900" : "bg-sky-100 text-sky-900"
                            }`}
                          >
                            {ord.channel === "offline" ? "POS" : "WEB"}
                          </span>
                        </div>
                        <p className="text-muted mt-0.5">
                          {ord.customerName} • {ord.items.length} items •{" "}
                          {new Date(ord.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </p>
                      </div>

                      <div className="text-right flex items-center gap-3">
                        <div>
                          <p className="font-bold text-charcoal">₹{ord.total}</p>
                          <span
                            className={`text-[10px] font-bold ${
                              ord.status === "Delivered"
                                ? "text-emerald-700"
                                : ord.status === "Cancelled"
                                ? "text-red-600"
                                : "text-amber-700"
                            }`}
                          >
                            {ord.status}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setTab("orders");
                            setOrderSearch(ord.id);
                          }}
                          className="px-2.5 py-1 rounded-lg border border-sand hover:border-sage text-[11px] font-semibold text-charcoal cursor-pointer"
                        >
                          View
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Low Stock Alerts Widget */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-sand p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-charcoal flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-clay" /> Inventory Alerts
                  </h3>
                  <p className="text-xs text-muted">Variants with stock under 15 units.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setBulkStockAction("restock_low");
                    setBulkStockAmount("50");
                    setShowBulkStockModal(true);
                  }}
                  className="text-xs font-bold text-sage hover:underline cursor-pointer"
                >
                  Restock All Low &rarr;
                </button>
              </div>

              {lowStockCount === 0 ? (
                <div className="text-center py-8 text-emerald-700 text-xs font-semibold">
                  ✓ Healthy inventory! All variants have sufficient stock.
                </div>
              ) : (
                <div className="divide-y divide-sand/50">
                  {products
                    .flatMap((p) =>
                      p.variants
                        .filter((v) => v.stock < 15)
                        .map((v) => ({ product: p, variant: v }))
                    )
                    .slice(0, 6)
                    .map(({ product: p, variant: v }) => (
                      <div key={v.id} className="py-2.5 flex items-center justify-between text-xs gap-2">
                        <div>
                          <p className="font-semibold text-charcoal">{p.name}</p>
                          <p className="text-[11px] text-muted">
                            {v.label} • SKU: {v.sku}
                          </p>
                        </div>
                        <div className="text-right flex items-center gap-2">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                              v.stock === 0
                                ? "bg-red-100 text-red-800"
                                : "bg-amber-100 text-amber-900"
                            }`}
                          >
                            {v.stock} left
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setTab("inventory");
                              setRateSearch(p.name);
                            }}
                            className="px-2 py-1 rounded-lg border border-sand text-[11px] font-semibold text-charcoal hover:border-sage cursor-pointer"
                          >
                            Edit
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 2. TAB: ORDERS MANAGEMENT                                      */}
      {/* ============================================================== */}
      {tab === "orders" && (
        <div className="space-y-6">
          {/* Orders Header & Search/Filter Controls Bar */}
          <div className="bg-white rounded-3xl border border-sand p-6 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sage bg-mint-light px-3 py-1 rounded-full mb-1">
                  <ShoppingBag className="w-3.5 h-3.5 text-sage" /> Order Management
                </span>
                <h2 className="font-editorial text-2xl font-bold text-charcoal">
                  Orders &amp; Deliveries ({filteredOrders.length} showing)
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  Search, filter, update statuses, print tax invoices, and manage customer handovers.
                </p>
              </div>

              {/* Expand / Collapse All buttons */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const allExp: Record<string, boolean> = {};
                    filteredOrders.forEach((o) => (allExp[o.id] = true));
                    setExpandedOrders(allExp);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-oat hover:bg-sand border border-sand text-xs font-semibold text-charcoal cursor-pointer"
                >
                  Expand All
                </button>
                <button
                  type="button"
                  onClick={() => setExpandedOrders({})}
                  className="px-3.5 py-2 rounded-xl bg-oat hover:bg-sand border border-sand text-xs font-semibold text-charcoal cursor-pointer"
                >
                  Collapse All
                </button>
              </div>
            </div>

            {/* Search Input & Channel Selector */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2 border-t border-sand/50">
              <div className="md:col-span-5 relative">
                <Search className="w-4 h-4 text-muted absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Search Order ID, Bill #, Customer Name, Phone, City, UTR..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-oat border border-sand text-xs text-charcoal focus:outline-none focus:border-sage"
                />
                {orderSearch && (
                  <button
                    type="button"
                    onClick={() => setOrderSearch("")}
                    className="absolute right-3 top-2.5 text-muted hover:text-charcoal cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Channel Filter */}
              <div className="md:col-span-3 flex items-center gap-1.5">
                <label className="text-xs font-bold text-muted uppercase">Channel:</label>
                <select
                  value={orderChannelFilter}
                  onChange={(e) => setOrderChannelFilter(e.target.value as "all" | "online" | "offline")}
                  className="w-full px-3 py-2 rounded-xl bg-oat border border-sand text-xs font-semibold text-charcoal cursor-pointer"
                >
                  <option value="all">All Channels ({orders.length})</option>
                  <option value="online">Online Web ({onlineOrders.length})</option>
                  <option value="offline">Offline POS ({offlineBills.length})</option>
                </select>
              </div>

              {/* Date Range Filter */}
              <div className="md:col-span-4 flex items-center gap-1.5">
                <label className="text-xs font-bold text-muted uppercase">Period:</label>
                <select
                  value={orderDateRange}
                  onChange={(e) => setOrderDateRange(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-oat border border-sand text-xs font-semibold text-charcoal cursor-pointer"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="7days">Last 7 Days</option>
                  <option value="month">This Month</option>
                </select>
              </div>
            </div>

            {/* Status Pills Bar */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-sand/40 text-xs">
              <span className="font-bold text-muted uppercase text-[10px] mr-1">Status:</span>
              <button
                type="button"
                onClick={() => setOrderFilter("All")}
                className={`px-3 py-1 rounded-full font-semibold cursor-pointer ${
                  orderFilter === "All" ? "bg-[#184D3B] text-white" : "bg-oat text-charcoal hover:bg-sand"
                }`}
              >
                All ({orders.length})
              </button>
              <button
                type="button"
                onClick={() => setOrderFilter("PENDING_CONFIRMATION")}
                className={`px-3 py-1 rounded-full font-semibold cursor-pointer ${
                  orderFilter === "PENDING_CONFIRMATION" ? "bg-amber-500 text-charcoal font-bold" : "bg-oat text-charcoal hover:bg-sand"
                }`}
              >
                Awaiting ({awaitingCount})
              </button>
              <button
                type="button"
                onClick={() => setOrderFilter("Confirmed")}
                className={`px-3 py-1 rounded-full font-semibold cursor-pointer ${
                  orderFilter === "Confirmed" ? "bg-blue-600 text-white" : "bg-oat text-charcoal hover:bg-sand"
                }`}
              >
                Confirmed
              </button>
              <button
                type="button"
                onClick={() => setOrderFilter("Shipped")}
                className={`px-3 py-1 rounded-full font-semibold cursor-pointer ${
                  orderFilter === "Shipped" ? "bg-indigo-600 text-white" : "bg-oat text-charcoal hover:bg-sand"
                }`}
              >
                Shipped
              </button>
              <button
                type="button"
                onClick={() => setOrderFilter("Delivered")}
                className={`px-3 py-1 rounded-full font-semibold cursor-pointer ${
                  orderFilter === "Delivered" ? "bg-emerald-600 text-white" : "bg-oat text-charcoal hover:bg-sand"
                }`}
              >
                Delivered ({deliveredCount})
              </button>
              <button
                type="button"
                onClick={() => setOrderFilter("Cancelled")}
                className={`px-3 py-1 rounded-full font-semibold cursor-pointer ${
                  orderFilter === "Cancelled" ? "bg-red-600 text-white" : "bg-oat text-charcoal hover:bg-sand"
                }`}
              >
                Cancelled ({cancelledCount})
              </button>
            </div>
          </div>

          {/* Orders List / Empty State */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-3xl border border-sand p-12 text-center space-y-3 shadow-xs">
              <ShoppingBag className="w-12 h-12 text-muted mx-auto" />
              <h3 className="text-base font-bold text-charcoal">No Orders Found</h3>
              <p className="text-xs text-muted max-w-md mx-auto">
                No orders match your active filter criteria. Try clearing your search query or selecting &quot;All Channels&quot;.
              </p>
              <button
                type="button"
                onClick={() => {
                  setOrderSearch("");
                  setOrderFilter("All");
                  setOrderChannelFilter("all");
                  setOrderDateRange("all");
                }}
                className="px-4 py-2 rounded-xl bg-oat hover:bg-sand text-xs font-bold text-charcoal cursor-pointer"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredOrders.map((ord) => renderCompactOrderCard(ord))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 3. TAB: INVENTORY & RATES                                      */}
      {/* ============================================================== */}
      {tab === "inventory" && (
        <div className="space-y-6">
          {/* Action Bar */}
          <div className="bg-white rounded-3xl border border-sand p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sage bg-mint-light px-3 py-1 rounded-full mb-1">
                <Boxes className="w-3.5 h-3.5 text-sage" /> Fast Rate &amp; Inventory Manager
              </span>
              <h2 className="font-editorial text-2xl font-bold text-charcoal">
                Catalog Rates &amp; Stock Setting ({totalVariants} Variants)
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Edit Selling Price (₹), MRP (₹), and Stock for each pack size. Click &quot;Save All Rates&quot; when finished.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => setShowBulkStockModal(true)}
                className="px-4 py-2.5 rounded-full bg-[#184D3B] text-white text-xs font-bold inline-flex items-center gap-1.5 hover:bg-[#12382B] shadow-sm cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Bulk Stock Tools</span>
              </button>

              <button
                type="button"
                onClick={() => handleAutoMrpAll(1.25)}
                className="px-4 py-2.5 rounded-full bg-oat border border-sand text-charcoal text-xs font-bold hover:border-sage cursor-pointer"
                title="Sets MRP to Price + 25% across all variants"
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
                <span>Save All Rates</span>
              </button>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white rounded-2xl border border-sand p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-muted uppercase">Category:</span>
              <button
                type="button"
                onClick={() => setRateCategory("all")}
                className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                  rateCategory === "all" ? "bg-sage text-cream" : "bg-oat text-charcoal hover:bg-sand"
                }`}
              >
                All
              </button>
              {BRAND.categories.map((c) => (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => setRateCategory(c.slug)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold cursor-pointer ${
                    rateCategory === c.slug ? "bg-sage text-cream" : "bg-oat text-charcoal hover:bg-sand"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value as any)}
                className="px-3 py-1.5 rounded-xl bg-oat border border-sand text-xs font-semibold text-charcoal cursor-pointer"
              >
                <option value="all">All Stock Statuses</option>
                <option value="low">Low Stock (&lt; 15 units)</option>
                <option value="out">Out of Stock (0 units)</option>
                <option value="in">In Stock (&ge; 15 units)</option>
              </select>

              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={rateSearch}
                  onChange={(e) => setRateSearch(e.target.value)}
                  placeholder="Filter product name..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-oat border border-sand text-xs focus:outline-none focus:border-sage"
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
                    <th className="px-5 py-3">Product Name &amp; Category</th>
                    <th className="px-4 py-3">Variant / Pack Size</th>
                    <th className="px-4 py-3 text-right">Selling Price (₹)</th>
                    <th className="px-4 py-3 text-right">Printed MRP (₹)</th>
                    <th className="px-4 py-3 text-center">Discount / Markup</th>
                    <th className="px-4 py-3 text-center">Stock Units</th>
                    <th className="px-4 py-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand/50">
                  {products
                    .filter((p) => (rateCategory === "all" ? true : p.category === rateCategory))
                    .filter((p) =>
                      rateSearch ? p.name.toLowerCase().includes(rateSearch.toLowerCase()) : true
                    )
                    .flatMap((prod) =>
                      prod.variants
                        .filter((v) => {
                          const s = parseInt(stockDrafts[v.id] || String(v.stock), 10);
                          if (stockFilter === "low") return s > 0 && s < 15;
                          if (stockFilter === "out") return s === 0;
                          if (stockFilter === "in") return s >= 15;
                          return true;
                        })
                        .map((variant) => {
                          const pVal = parseFloat(priceDrafts[variant.id] || String(variant.price));
                          const mVal = parseFloat(mrpDrafts[variant.id] || String(variant.mrp || Math.round(variant.price * 1.25)));
                          const sVal = parseInt(stockDrafts[variant.id] || String(variant.stock), 10);
                          const discountPercent = mVal > pVal && mVal > 0 ? Math.round(((mVal - pVal) / mVal) * 100) : 0;

                          return (
                            <tr key={variant.id} className="hover:bg-oat/30 transition-colors">
                              <td className="px-5 py-3 font-semibold text-charcoal">
                                <div>{prod.name}</div>
                                <span className="text-[10px] text-muted font-normal uppercase">
                                  {prod.category}
                                </span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="font-bold text-charcoal">{variant.label}</span>
                                <div className="text-[10px] text-muted font-mono">{variant.sku}</div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="inline-flex items-center gap-1 justify-end">
                                  <span className="text-muted font-bold">₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={priceDrafts[variant.id] ?? variant.price}
                                    onChange={(e) =>
                                      setPriceDrafts((prev) => ({ ...prev, [variant.id]: e.target.value }))
                                    }
                                    className="w-20 px-2 py-1 rounded-lg bg-cream border border-sand text-right font-bold text-charcoal focus:outline-none focus:border-sage"
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-3 text-right">
                                <div className="inline-flex items-center gap-1 justify-end">
                                  <span className="text-muted font-bold">₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={mrpDrafts[variant.id] ?? (variant.mrp || Math.round(variant.price * 1.25))}
                                    onChange={(e) =>
                                      setMrpDrafts((prev) => ({ ...prev, [variant.id]: e.target.value }))
                                    }
                                    className="w-20 px-2 py-1 rounded-lg bg-cream border border-sand text-right font-bold text-charcoal focus:outline-none focus:border-sage"
                                  />
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center">
                                {discountPercent > 0 ? (
                                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    {discountPercent}% OFF
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-muted">0%</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center">
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  value={stockDrafts[variant.id] ?? variant.stock}
                                  onChange={(e) =>
                                    setStockDrafts((prev) => ({ ...prev, [variant.id]: e.target.value }))
                                  }
                                  className={`w-16 px-2 py-1 rounded-lg border text-center font-bold focus:outline-none ${
                                    sVal === 0
                                      ? "bg-red-50 border-red-300 text-red-700"
                                      : sVal < 15
                                      ? "bg-amber-50 border-amber-300 text-amber-800"
                                      : "bg-cream border-sand text-charcoal"
                                  }`}
                                />
                              </td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleSaveSingleVariantRate(prod, variant.id)}
                                  className="px-2.5 py-1 rounded-lg bg-[#184D3B] hover:bg-[#12382B] text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                                  title="Save this single variant rate"
                                >
                                  <Check className="w-3 h-3" /> Save
                                </button>
                              </td>
                            </tr>
                          );
                        })
                    )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 4. TAB: PRODUCTS CATALOG                                       */}
      {/* ============================================================== */}
      {tab === "products" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Add Product Form */}
          <form
            onSubmit={handleAddProduct}
            className="lg:col-span-4 bg-white rounded-3xl border border-sand p-6 space-y-3.5 shadow-xs"
          >
            <h2 className="font-editorial text-xl font-bold text-charcoal flex items-center gap-2">
              <Plus className="w-4 h-4 text-sage" /> Add New Product
            </h2>
            <input
              required
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Product Name (e.g. Lavender Floor Cleaner)"
              className="w-full px-3 py-2 rounded-xl bg-cream border border-sand text-xs font-semibold"
            />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CategorySlug)}
              className="w-full px-3 py-2 rounded-xl bg-cream border border-sand text-xs font-semibold cursor-pointer"
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
              className="w-full px-3 py-2 rounded-xl bg-cream border border-sand text-xs"
            />
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={variantLabel}
                onChange={(e) => setVariantLabel(e.target.value)}
                placeholder="Size (e.g. 1L, 500ml)"
                className="px-3 py-2 rounded-xl bg-cream border border-sand text-xs"
              />
              <input
                type="text"
                value={scent}
                onChange={(e) => setScent(e.target.value)}
                placeholder="Scent profile"
                className="px-3 py-2 rounded-xl bg-cream border border-sand text-xs"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <input
                required
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="Selling Price ₹"
                className="px-3 py-2 rounded-xl bg-cream border border-sand text-xs"
              />
              <input
                required
                type="number"
                value={mrp}
                onChange={(e) => setMrp(e.target.value)}
                placeholder="MRP ₹"
                className="px-3 py-2 rounded-xl bg-cream border border-sand text-xs"
              />
              <input
                required
                type="number"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="Stock"
                className="px-3 py-2 rounded-xl bg-cream border border-sand text-xs"
              />
            </div>
            <input
              type="text"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
              placeholder="SKU (optional, auto-generated)"
              className="w-full px-3 py-2 rounded-xl bg-cream border border-sand text-xs font-mono"
            />

            {/* Attached Photo Upload */}
            <div className="p-3 rounded-xl bg-oat border border-sand space-y-2">
              <label className="block text-[11px] font-bold text-charcoal uppercase">
                Product Photo
              </label>
              {newProductImage ? (
                <div className="flex items-center gap-3">
                  <img
                    src={newProductImage}
                    alt="Preview"
                    className="w-12 h-12 object-cover rounded-lg border border-sand shrink-0"
                  />
                  <div className="text-[11px] truncate flex-1">
                    <p className="font-semibold text-charcoal truncate">{newProductImage.split("/").pop()}</p>
                    <button
                      type="button"
                      onClick={() => setNewProductImage("")}
                      className="text-red-600 font-bold hover:underline cursor-pointer"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-sand hover:border-sage bg-white cursor-pointer text-xs font-semibold text-charcoal">
                  <ImagePlus className="w-4 h-4 text-sage" />
                  <span>{uploadingNewProductImage ? "Uploading..." : "Attach Photo"}</span>
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
              className="w-full py-2.5 rounded-xl bg-[#184D3B] hover:bg-[#12382B] text-white text-xs font-bold transition cursor-pointer"
            >
              Add Product to Catalog
            </button>
          </form>

          {/* Catalog Products List */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-sand p-6 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="font-editorial text-xl font-bold text-charcoal">
                  Live Catalog Items ({products.length} Products)
                </h2>
                <p className="text-xs text-muted">Click &quot;Edit&quot; on any product to update variants, name, or photo.</p>
              </div>
              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  placeholder="Search catalog..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-oat border border-sand text-xs focus:outline-none focus:border-sage"
                />
              </div>
            </div>

            <div className="space-y-3">
              {products
                .filter((p) =>
                  productSearch ? p.name.toLowerCase().includes(productSearch.toLowerCase()) : true
                )
                .map((p) => (
                  <div
                    key={p.id}
                    className="p-4 rounded-2xl border border-sand bg-cream/30 flex flex-wrap items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-white border border-sand shrink-0">
                        <SafeImage
                          src={p.image}
                          alt={p.name}
                          fallbackSrc={getCategoryFallbackImage(p.category)}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm text-charcoal">{p.name}</h4>
                          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-oat text-charcoal">
                            {p.category}
                          </span>
                        </div>
                        <p className="text-xs text-muted mt-0.5">
                          {p.variants.length} {p.variants.length === 1 ? "variant" : "variants"}:{" "}
                          {p.variants.map((v) => `${v.label} (₹${v.price})`).join(", ")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingProduct(p)}
                        className="px-3 py-1.5 rounded-xl border border-sand bg-white hover:bg-oat text-xs font-semibold text-charcoal inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-sage" /> Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(p.id, p.name)}
                        className="p-1.5 rounded-xl border border-sand bg-white hover:bg-red-50 text-muted hover:text-red-600 cursor-pointer"
                        title="Delete product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 5. TAB: CUSTOMERS DIRECTORY                                    */}
      {/* ============================================================== */}
      {tab === "customers" && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-sand p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sage bg-mint-light px-3 py-1 rounded-full mb-1">
                <Users className="w-3.5 h-3.5 text-sage" /> Customer Directory
              </span>
              <h2 className="font-editorial text-2xl font-bold text-charcoal">
                Unique Customers ({customers.length} Accounts)
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Aggregated from online and counter orders. Customer histories are completely isolated on their device tracking pages.
              </p>
            </div>

            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-2.5" />
              <input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search name, phone, city..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-oat border border-sand text-xs focus:outline-none focus:border-sage"
              />
            </div>
          </div>

          {/* Customers Table */}
          <div className="bg-white rounded-3xl border border-sand overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-oat/70 text-charcoal border-b border-sand uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-5 py-3">Customer Name</th>
                    <th className="px-4 py-3">Mobile / WhatsApp</th>
                    <th className="px-4 py-3 text-center">Orders Placed</th>
                    <th className="px-4 py-3 text-right">Lifetime Spend (₹)</th>
                    <th className="px-4 py-3">Locations / Cities</th>
                    <th className="px-4 py-3">Channels Used</th>
                    <th className="px-4 py-3">Last Active</th>
                    <th className="px-4 py-3 text-center">Contact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand/50">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-8 text-center text-muted">
                        No customer records found.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((cust, idx) => (
                      <tr key={idx} className="hover:bg-oat/30 transition-colors">
                        <td className="px-5 py-3 font-semibold text-charcoal">{cust.name}</td>
                        <td className="px-4 py-3 font-mono font-medium">{cust.phone || "N/A"}</td>
                        <td className="px-4 py-3 text-center font-bold">{cust.orderCount}</td>
                        <td className="px-4 py-3 text-right font-bold text-charcoal">₹{cust.totalSpent.toLocaleString("en-IN")}</td>
                        <td className="px-4 py-3 text-muted">{Array.from(cust.cities).join(", ")}</td>
                        <td className="px-4 py-3 text-[11px] font-semibold text-sage">{Array.from(cust.channels).join(" + ")}</td>
                        <td className="px-4 py-3 text-muted">
                          {new Date(cust.lastOrderDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {cust.phone ? (
                            <a
                              href={`https://wa.me/91${cust.phone}?text=${encodeURIComponent(
                                `Hello ${cust.name}, thank you for choosing EVOKA natural homecare.`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-600 hover:text-white border border-emerald-200 text-emerald-800 text-[11px] font-bold inline-flex items-center gap-1 transition-colors"
                            >
                              <MessageSquare className="w-3 h-3" /> WhatsApp
                            </a>
                          ) : (
                            <span className="text-muted text-[10px]">Direct</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 6. TAB: OFFLINE SALES & POS BILLING                            */}
      {/* ============================================================== */}
      {tab === "offline" && (
        <div className="space-y-6">
          {/* POS Header */}
          <div className="bg-white rounded-3xl border border-sand p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-3 py-1 rounded-full mb-1">
                <Receipt className="w-3.5 h-3.5 text-amber-700" /> Point of Sale Counter Billing
              </span>
              <h2 className="font-editorial text-2xl font-bold text-charcoal">
                Offline Store Billing Terminal
              </h2>
              <p className="text-xs text-muted mt-0.5">
                Generate official store bills, instantly deduct inventory, and print receipt invoices.
              </p>
            </div>

            <div className="text-right">
              <span className="text-xs text-muted">Total Offline Revenue:</span>
              <p className="text-xl font-bold text-charcoal">₹{offlineRevenue.toLocaleString("en-IN")}</p>
            </div>
          </div>

          {/* POS Terminal Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left: Product Selection & Bill Builder */}
            <div className="lg:col-span-7 bg-white rounded-3xl border border-sand p-6 space-y-5 shadow-xs">
              <h3 className="text-base font-bold text-charcoal flex items-center gap-2">
                <Store className="w-4 h-4 text-sage" /> 1. Select Products from Catalogue
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                {/* Product Dropdown */}
                <div className="md:col-span-6">
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Product</label>
                  <select
                    value={posSelectedProductId}
                    onChange={(e) => {
                      setPosSelectedProductId(e.target.value);
                      const prod = products.find((p) => p.id === e.target.value);
                      if (prod && prod.variants.length > 0) {
                        setPosSelectedVariantId(prod.variants[0].id);
                      } else {
                        setPosSelectedVariantId("");
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-oat border border-sand text-xs font-semibold cursor-pointer"
                  >
                    <option value="">Select Product...</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Variant Dropdown */}
                <div className="md:col-span-4">
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Pack Size</label>
                  <select
                    value={posSelectedVariantId}
                    onChange={(e) => setPosSelectedVariantId(e.target.value)}
                    disabled={!posSelectedProductId}
                    className="w-full px-3 py-2 rounded-xl bg-oat border border-sand text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {posSelectedProductId ? (
                      products
                        .find((p) => p.id === posSelectedProductId)
                        ?.variants.map((v) => (
                          <option key={v.id} value={v.id}>
                            {v.label} (₹{v.price} • {v.stock} in stock)
                          </option>
                        ))
                    ) : (
                      <option value="">Select product first</option>
                    )}
                  </select>
                </div>

                {/* Qty Input & Add Button */}
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">Qty</label>
                  <input
                    type="number"
                    min="1"
                    value={posSelectedQty}
                    onChange={(e) => setPosSelectedQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-2 py-2 rounded-xl bg-cream border border-sand text-xs text-center font-bold"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={handleAddPosItem}
                disabled={!posSelectedProductId || !posSelectedVariantId}
                className="w-full py-2.5 rounded-xl bg-[#184D3B] hover:bg-[#12382B] text-white text-xs font-bold transition cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Add to Bill
              </button>

              {/* Items in Current Bill */}
              <div className="pt-3 border-t border-sand">
                <h4 className="text-xs font-bold uppercase text-charcoal mb-2">
                  Bill Items ({posItems.length})
                </h4>
                {posItems.length === 0 ? (
                  <p className="text-xs text-muted italic py-4 text-center">
                    Cart is empty. Add products above to start billing.
                  </p>
                ) : (
                  <div className="rounded-xl border border-sand overflow-hidden">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-oat/70 text-charcoal uppercase text-[10px] font-bold">
                        <tr>
                          <th className="px-3 py-2">Item</th>
                          <th className="px-3 py-2 text-right">Price</th>
                          <th className="px-3 py-2 text-center">Qty</th>
                          <th className="px-3 py-2 text-right">Total</th>
                          <th className="px-3 py-2 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-sand/50">
                        {posItems.map((it, idx) => (
                          <tr key={idx} className="hover:bg-oat/20">
                            <td className="px-3 py-2 font-medium">
                              {it.name} <span className="text-muted text-[10px]">({it.variantLabel})</span>
                            </td>
                            <td className="px-3 py-2 text-right">₹{it.price}</td>
                            <td className="px-3 py-2 text-center font-bold">{it.quantity}</td>
                            <td className="px-3 py-2 text-right font-bold text-charcoal">₹{it.price * it.quantity}</td>
                            <td className="px-3 py-2 text-center">
                              <button
                                type="button"
                                onClick={() => setPosItems((prev) => prev.filter((_, i) => i !== idx))}
                                className="text-red-600 hover:text-red-800 text-[11px] font-bold cursor-pointer"
                              >
                                ✕
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Customer Info & Checkout */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-sand p-6 space-y-4 shadow-xs">
              <h3 className="text-base font-bold text-charcoal flex items-center gap-2">
                <Receipt className="w-4 h-4 text-sage" /> 2. Customer &amp; Bill Summary
              </h3>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">
                    Customer Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={posCustomerName}
                    onChange={(e) => setPosCustomerName(e.target.value)}
                    placeholder="Walk-in Customer"
                    className="w-full px-3 py-2 rounded-xl bg-cream border border-sand text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">
                    Mobile Number (Optional)
                  </label>
                  <input
                    type="tel"
                    value={posCustomerPhone}
                    onChange={(e) => setPosCustomerPhone(e.target.value)}
                    placeholder="10-digit WhatsApp number"
                    className="w-full px-3 py-2 rounded-xl bg-cream border border-sand text-xs font-mono"
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPosPaymentMethod("cash")}
                      className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                        posPaymentMethod === "cash"
                          ? "bg-[#184D3B] text-white border-[#184D3B]"
                          : "bg-oat text-charcoal border-sand"
                      }`}
                    >
                      Cash
                    </button>
                    <button
                      type="button"
                      onClick={() => setPosPaymentMethod("upi")}
                      className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                        posPaymentMethod === "upi"
                          ? "bg-[#184D3B] text-white border-[#184D3B]"
                          : "bg-oat text-charcoal border-sand"
                      }`}
                    >
                      UPI
                    </button>
                    <button
                      type="button"
                      onClick={() => setPosPaymentMethod("card")}
                      className={`py-2 rounded-xl text-xs font-bold border cursor-pointer ${
                        posPaymentMethod === "card"
                          ? "bg-[#184D3B] text-white border-[#184D3B]"
                          : "bg-oat text-charcoal border-sand"
                      }`}
                    >
                      Card
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-muted mb-1">
                      Discount (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={posDiscount}
                      onChange={(e) => setPosDiscount(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full px-3 py-2 rounded-xl bg-cream border border-sand text-xs font-bold text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-muted mb-1">
                      Packaging / Del (₹)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={posDeliveryFee}
                      onChange={(e) => setPosDeliveryFee(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full px-3 py-2 rounded-xl bg-cream border border-sand text-xs font-bold text-right"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-muted mb-1">
                    Internal Note / Cashier
                  </label>
                  <input
                    type="text"
                    value={posNotes}
                    onChange={(e) => setPosNotes(e.target.value)}
                    placeholder="Counter Notes..."
                    className="w-full px-3 py-2 rounded-xl bg-cream border border-sand text-xs"
                  />
                </div>
              </div>

              {/* Total Calculation Card */}
              <div className="p-4 rounded-2xl bg-oat border border-sand space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted">Subtotal:</span>
                  <span className="font-semibold text-charcoal">₹{posSubtotal}</span>
                </div>
                {posDiscount > 0 && (
                  <div className="flex justify-between text-emerald-800">
                    <span>Discount:</span>
                    <span>-₹{posDiscount}</span>
                  </div>
                )}
                {posDeliveryFee > 0 && (
                  <div className="flex justify-between text-muted">
                    <span>Packaging / Delivery:</span>
                    <span>+₹{posDeliveryFee}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-sand flex justify-between items-baseline text-base font-bold text-charcoal">
                  <span>Grand Total:</span>
                  <span className="text-2xl text-[#184D3B]">₹{posTotal}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleCreateOfflineBill()}
                disabled={submittingPosOrder || posItems.length === 0}
                className="w-full py-3.5 rounded-2xl bg-[#184D3B] hover:bg-[#12382B] text-white text-sm font-bold shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4 text-champagne" />
                <span>{submittingPosOrder ? "Generating Bill..." : "Generate Bill & Print Receipt"}</span>
              </button>
            </div>
          </div>

          {/* Previous Offline Bills Table */}
          <div className="bg-white rounded-3xl border border-sand p-6 shadow-xs space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-charcoal flex items-center gap-2">
                  <Clock className="w-4 h-4 text-sage" /> Offline Sales History ({offlineBills.length} Bills)
                </h3>
                <p className="text-xs text-muted">History of all counter transactions and POS invoices.</p>
              </div>

              <div className="relative w-64">
                <Search className="w-3.5 h-3.5 text-muted absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={offlineSearch}
                  onChange={(e) => setOfflineSearch(e.target.value)}
                  placeholder="Search Bill #, customer..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-oat border border-sand text-xs focus:outline-none focus:border-sage"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-sand overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-oat/70 text-charcoal uppercase text-[10px] font-bold">
                  <tr>
                    <th className="px-4 py-3">Bill Number</th>
                    <th className="px-4 py-3">Date &amp; Time</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3 text-center">Items</th>
                    <th className="px-4 py-3">Method</th>
                    <th className="px-4 py-3 text-right">Amount</th>
                    <th className="px-4 py-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-sand/50">
                  {filteredOfflineBills.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-muted">
                        No offline transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    filteredOfflineBills.map((bill) => (
                      <tr key={bill.id} className="hover:bg-oat/20">
                        <td className="px-4 py-3 font-mono font-bold text-charcoal">
                          {bill.offlineBillNumber || bill.id}
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {new Date(bill.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}{" "}
                          {new Date(bill.createdAt).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          })}
                        </td>
                        <td className="px-4 py-3 font-semibold text-charcoal">
                          {bill.customerName} {bill.phone && bill.phone !== "9999999999" && `(${bill.phone})`}
                        </td>
                        <td className="px-4 py-3 text-center">{bill.items.length} items</td>
                        <td className="px-4 py-3 uppercase font-bold text-sage">{bill.paymentMethod}</td>
                        <td className="px-4 py-3 text-right font-bold text-charcoal">₹{bill.total}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handlePrintInvoicePdf(bill)}
                            className="px-2.5 py-1 rounded-lg bg-oat hover:bg-sand border border-sand text-xs font-semibold text-charcoal inline-flex items-center gap-1 cursor-pointer mr-1.5"
                          >
                            <Printer className="w-3 h-3 text-sage" /> Print
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteSingleOrder(bill.id)}
                            className="p-1 rounded-lg hover:bg-red-50 text-muted hover:text-red-600 cursor-pointer"
                            title="Delete bill"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. TAB: SALES REPORTS                                          */}
      {/* ============================================================== */}
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
                Filter by period, view separated Online vs Offline revenue, and download official PDF or CSV reports.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <a
                href={`/api/admin/sales-report-pdf?range=${reportRange}${
                  reportRange === "custom" ? `&from=${reportFromDate}&to=${reportToDate}` : ""
                }`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 rounded-full bg-[#184D3B] hover:bg-[#12382B] text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Report PDF</span>
              </a>

              <button
                type="button"
                onClick={handleExportSalesReportCsv}
                className="px-4 py-2.5 rounded-full bg-oat border border-sand text-charcoal text-xs font-bold inline-flex items-center gap-1.5 hover:border-sage cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-sage" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Date Range Selector */}
          <div className="bg-white rounded-2xl border border-sand p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-muted uppercase">Period:</span>
              {(
                [
                  { id: "today", label: "Today" },
                  { id: "yesterday", label: "Yesterday" },
                  { id: "7days", label: "Last 7 Days" },
                  { id: "month", label: "This Month" },
                  { id: "all", label: "All Time" },
                  { id: "custom", label: "Custom Range" },
                ] as const
              ).map((btn) => (
                <button
                  key={btn.id}
                  type="button"
                  onClick={() => setReportRange(btn.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all ${
                    reportRange === btn.id
                      ? "bg-[#184D3B] text-white shadow-xs"
                      : "bg-oat text-charcoal hover:bg-sand"
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {reportRange === "custom" && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <input
                  type="date"
                  value={reportFromDate}
                  onChange={(e) => setReportFromDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-oat border border-sand"
                />
                <span className="text-muted">to</span>
                <input
                  type="date"
                  value={reportToDate}
                  onChange={(e) => setReportToDate(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-oat border border-sand"
                />
              </div>
            )}
          </div>

          {/* Report KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-sand p-5 space-y-1">
              <p className="text-[11px] text-muted uppercase font-bold tracking-wider">Total Sales</p>
              <p className="text-2xl font-bold text-[#184D3B]">₹{reportNetSales.toLocaleString("en-IN")}</p>
              <p className="text-[11px] text-muted">{reportActiveOrders.length} successful transactions</p>
            </div>
            <div className="bg-white rounded-2xl border border-sand p-5 space-y-1">
              <p className="text-[11px] text-sky-800 uppercase font-bold tracking-wider">Online Revenue</p>
              <p className="text-2xl font-bold text-sky-800">₹{reportOnlineSales.toLocaleString("en-IN")}</p>
              <p className="text-[11px] text-muted">{reportOnlineOrders.length} online orders</p>
            </div>
            <div className="bg-white rounded-2xl border border-sand p-5 space-y-1">
              <p className="text-[11px] text-amber-800 uppercase font-bold tracking-wider">Offline POS</p>
              <p className="text-2xl font-bold text-amber-800">₹{reportOfflineSales.toLocaleString("en-IN")}</p>
              <p className="text-[11px] text-muted">{reportOfflineOrders.length} counter bills</p>
            </div>
            <div className="bg-white rounded-2xl border border-sand p-5 space-y-1">
              <p className="text-[11px] text-muted uppercase font-bold tracking-wider">Avg Ticket (AOV)</p>
              <p className="text-2xl font-bold text-charcoal">₹{reportAov}</p>
              <p className="text-[11px] text-muted">Per active customer</p>
            </div>
          </div>

          {/* Top Selling Products in Period */}
          {reportTopProducts.length > 0 && (
            <div className="bg-white rounded-3xl border border-sand p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-charcoal flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-sage" /> Top Performing Products in Period
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {reportTopProducts.map((tp, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-oat/50 border border-sand/70 space-y-1">
                    <p className="font-bold text-sm text-charcoal truncate">{tp.name}</p>
                    <p className="text-xs text-muted">
                      Units Sold: <strong className="text-charcoal">{tp.qty}</strong>
                    </p>
                    <p className="text-sm font-bold text-[#184D3B]">₹{tp.revenue.toLocaleString("en-IN")}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* 8. TAB: SETTINGS & STORE MANAGEMENT                            */}
      {/* ============================================================== */}
      {tab === "settings" && (
        <div className="space-y-6">
          {/* Settings Sub-navigation Bar */}
          <div className="flex flex-wrap gap-2 border-b border-sand pb-3">
            <button
              type="button"
              onClick={() => setSettingsSubTab("delivery")}
              className={`px-4 py-2 rounded-full text-xs font-bold cursor-pointer ${
                settingsSubTab === "delivery"
                  ? "bg-[#184D3B] text-white shadow-xs"
                  : "bg-white border border-sand text-charcoal hover:bg-oat"
              }`}
            >
              Delivery &amp; Shipping
            </button>
            <button
              type="button"
              onClick={() => setSettingsSubTab("coupons")}
              className={`px-4 py-2 rounded-full text-xs font-bold cursor-pointer ${
                settingsSubTab === "coupons"
                  ? "bg-[#184D3B] text-white shadow-xs"
                  : "bg-white border border-sand text-charcoal hover:bg-oat"
              }`}
            >
              Promo Coupons ({coupons.length})
            </button>
            <button
              type="button"
              onClick={() => setSettingsSubTab("bulk")}
              className={`px-4 py-2 rounded-full text-xs font-bold cursor-pointer ${
                settingsSubTab === "bulk"
                  ? "bg-[#184D3B] text-white shadow-xs"
                  : "bg-white border border-sand text-charcoal hover:bg-oat"
              }`}
            >
              Bulk CSV &amp; Backups
            </button>
            <button
              type="button"
              onClick={() => setSettingsSubTab("reset")}
              className={`px-4 py-2 rounded-full text-xs font-bold cursor-pointer ${
                settingsSubTab === "reset"
                  ? "bg-red-700 text-white shadow-xs"
                  : "bg-white border border-red-200 text-red-700 hover:bg-red-50"
              }`}
            >
              Database Reset (Start Fresh)
            </button>
          </div>

          {/* Subtab 1: Delivery Setting */}
          {settingsSubTab === "delivery" && (
            <div className="max-w-2xl bg-white rounded-3xl border border-sand p-8 space-y-6 shadow-xs">
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

          {/* Subtab 2: Promo Coupons */}
          {settingsSubTab === "coupons" && (
            <div className="space-y-6">
              <div className="bg-white rounded-3xl border border-sand p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-sage bg-mint-light px-3 py-1 rounded-full mb-1">
                    <Ticket className="w-3.5 h-3.5 text-sage" /> Custom Promo Coupons
                  </span>
                  <h2 className="font-editorial text-2xl font-bold text-charcoal">
                    Manage Promotional Discount Codes ({coupons.length})
                  </h2>
                  <p className="text-xs text-muted mt-0.5">
                    Create dynamic coupons, set minimum order requirements, or disable codes anytime.
                  </p>
                </div>
              </div>

              {/* Add Coupon Form */}
              <form
                onSubmit={handleSaveCoupon}
                className="bg-white rounded-3xl border border-sand p-6 space-y-4 shadow-xs"
              >
                <h3 className="text-sm font-bold text-charcoal uppercase tracking-wider flex items-center gap-2">
                  <Plus className="w-4 h-4 text-sage" /> Create New Promo Coupon
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-muted uppercase mb-1">Coupon Code</label>
                    <input
                      required
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="e.g. SAVE20"
                      className="w-full px-3 py-2 rounded-xl bg-cream border border-sand text-xs font-mono font-bold uppercase"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-muted uppercase mb-1">Discount (%)</label>
                    <input
                      required
                      type="number"
                      min="1"
                      max="100"
                      value={couponDiscount}
                      onChange={(e) => setCouponDiscount(e.target.value)}
                      placeholder="20"
                      className="w-full px-3 py-2 rounded-xl bg-cream border border-sand text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-muted uppercase mb-1">Min Order (₹)</label>
                    <input
                      type="number"
                      min="0"
                      value={couponMinOrder}
                      onChange={(e) => setCouponMinOrder(e.target.value)}
                      placeholder="499"
                      className="w-full px-3 py-2 rounded-xl bg-cream border border-sand text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-muted uppercase mb-1">Description</label>
                    <input
                      type="text"
                      value={couponDesc}
                      onChange={(e) => setCouponDesc(e.target.value)}
                      placeholder="e.g. Festival 20% OFF"
                      className="w-full px-3 py-2 rounded-xl bg-cream border border-sand text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingCoupon}
                  className="px-5 py-2.5 rounded-xl bg-[#184D3B] hover:bg-[#12382B] text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
                >
                  {savingCoupon ? "Saving..." : "Create & Activate Coupon"}
                </button>
              </form>

              {/* Coupons List */}
              <div className="bg-white rounded-3xl border border-sand overflow-hidden shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-oat/70 text-charcoal uppercase text-[10px] font-bold">
                    <tr>
                      <th className="px-5 py-3">Code</th>
                      <th className="px-4 py-3">Discount</th>
                      <th className="px-4 py-3">Min Order</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sand/50">
                    {coupons.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-muted">
                          No promotional coupons created yet. Create one above to activate.
                        </td>
                      </tr>
                    ) : (
                      coupons.map((c) => (
                        <tr key={c.code} className="hover:bg-oat/20">
                          <td className="px-5 py-3 font-mono font-bold text-charcoal">{c.code}</td>
                          <td className="px-4 py-3 font-bold text-emerald-700">{c.discountPercent}% OFF</td>
                          <td className="px-4 py-3 text-muted">₹{c.minOrder || 0}</td>
                          <td className="px-4 py-3 text-charcoal">{c.description}</td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleCoupon(c)}
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                                c.active !== false
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-sand text-muted"
                              }`}
                            >
                              {c.active !== false ? "Active" : "Disabled"}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleDeleteCoupon(c.code)}
                              className="text-red-600 hover:text-red-800 font-bold text-xs cursor-pointer"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Subtab 3: Bulk CSV & Backups */}
          {settingsSubTab === "bulk" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-3xl border border-sand p-8 space-y-5 shadow-xs">
                <h3 className="font-editorial text-2xl font-bold text-charcoal">
                  1. Bulk Product CSV Upload
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  Supports columns: <code>Category, Product Name, Pack Size, Price, MRP, Stock, SKU, Description, Image</code>.
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

                <label className="flex flex-col items-center justify-center p-8 rounded-2xl border-2 border-dashed border-sand hover:border-sage bg-oat/50 cursor-pointer text-center">
                  <Upload className="w-8 h-8 text-sage mb-2" />
                  <span className="text-xs font-semibold text-charcoal">Upload Products CSV</span>
                  <input type="file" accept=".csv" onChange={handleCsvUpload} className="hidden" />
                </label>

                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="w-full py-2.5 rounded-xl border border-sand bg-oat hover:bg-sand text-xs font-bold text-charcoal inline-flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-sage" /> Download Catalog CSV Backup
                </button>
              </div>

              <div className="bg-white rounded-3xl border border-sand p-8 space-y-5 shadow-xs">
                <h3 className="font-editorial text-2xl font-bold text-charcoal">
                  2. Product Images Uploader
                </h3>
                <p className="text-xs text-muted leading-relaxed">
                  Upload high-resolution photography for any product. Images are optimized and stored in your Netlify asset bucket.
                </p>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {products.map((p) => (
                    <div
                      key={p.id}
                      className="p-3 rounded-xl border border-sand bg-oat/30 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <img src={p.image} alt={p.name} className="w-8 h-8 object-cover rounded-lg shrink-0" />
                        <span className="font-semibold text-charcoal truncate">{p.name}</span>
                      </div>
                      <label className="px-3 py-1 rounded-lg bg-white border border-sand hover:border-sage font-bold text-charcoal cursor-pointer shrink-0">
                        Upload
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, p.slug)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Subtab 4: Database Reset (Start Fresh) */}
          {settingsSubTab === "reset" && (
            <div className="max-w-2xl bg-white rounded-3xl border-2 border-red-200 p-8 space-y-5 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-700 shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-editorial text-2xl font-bold text-red-700">
                    Start Fresh — Reset Order Management Database
                  </h3>
                  <p className="text-xs text-muted">
                    Controlled administrator operation to start order history from zero.
                  </p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-2 leading-relaxed">
                <p className="font-bold">What this operation does:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Permanently deletes ALL customer orders and offline bills.</li>
                  <li>Resets historical sales figures and revenue metrics to ₹0.</li>
                  <li>Clears invoice sequencing to start fresh from BILL-2026-0001.</li>
                  <li>Device order histories across all customer browsers have already been permanently purged.</li>
                </ul>
                <p className="font-bold pt-2 border-t border-red-200">What is PRESERVED:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Your entire 50-item product catalog and all variants.</li>
                  <li>Current inventory stock counts and pricing.</li>
                  <li>Store delivery fee settings and promotional coupons.</li>
                </ul>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleClearAllOrders}
                  className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold shadow-md hover:shadow-lg transition cursor-pointer inline-flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Wipe All Orders &amp; Reset Sales History to ₹0</span>
                </button>
                <p className="text-[11px] text-muted text-center mt-2">
                  Requires Admin PIN confirmation (<code className="font-mono">farhan2009</code>).
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODALS                                                         */}
      {/* ============================================================== */}

      {/* Full Product Editor Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 md:p-8 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-sand pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-sage bg-mint-light px-2.5 py-0.5 rounded-full">
                  Product Editor
                </span>
                <h3 className="font-editorial text-2xl font-bold text-charcoal mt-1">
                  Edit &quot;{editingProduct.name}&quot;
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="p-2 rounded-full hover:bg-sand/40 text-charcoal cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-charcoal uppercase mb-1">Product Name</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-cream border border-sand font-semibold text-charcoal"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-charcoal uppercase mb-1">Category</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, category: e.target.value as CategorySlug })
                    }
                    className="w-full px-3 py-2 rounded-xl bg-cream border border-sand font-semibold cursor-pointer"
                  >
                    {BRAND.categories.map((c) => (
                      <option key={c.slug} value={c.slug}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-charcoal uppercase mb-1">Tagline</label>
                  <input
                    type="text"
                    value={editingProduct.shortTagline || ""}
                    onChange={(e) => setEditingProduct({ ...editingProduct, shortTagline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-cream border border-sand font-semibold text-charcoal"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-charcoal uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingProduct.description || ""}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-cream border border-sand font-medium text-charcoal"
                />
              </div>

              {/* Photo replacement */}
              <div className="p-3 rounded-xl bg-oat border border-sand flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={editingProduct.image}
                    alt={editingProduct.name}
                    className="w-12 h-12 rounded-lg object-cover border border-sand shrink-0"
                  />
                  <div>
                    <p className="font-bold text-charcoal">Product Photo</p>
                    <p className="text-muted text-[11px] truncate max-w-xs">{editingProduct.image}</p>
                  </div>
                </div>
                <label className="px-3 py-1.5 rounded-xl bg-white border border-sand hover:border-sage text-xs font-bold text-charcoal cursor-pointer shrink-0">
                  Replace Photo
                  <input type="file" accept="image/*" onChange={handleEditProductImageUpload} className="hidden" />
                </label>
              </div>

              {/* Variants Editor */}
              <div className="pt-2 border-t border-sand space-y-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-charcoal uppercase text-xs">
                    Pack Sizes &amp; Variants ({editingProduct.variants.length})
                  </label>
                  <button
                    type="button"
                    onClick={handleAddVariantToEditingProduct}
                    className="px-3 py-1 rounded-lg bg-oat hover:bg-sand border border-sand text-[11px] font-bold text-charcoal inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3 text-sage" /> Add Pack Size
                  </button>
                </div>

                <div className="space-y-2">
                  {editingProduct.variants.map((v) => (
                    <div
                      key={v.id}
                      className="p-3 rounded-xl bg-cream border border-sand grid grid-cols-12 gap-2 items-center"
                    >
                      <div className="col-span-3">
                        <label className="block text-[9px] font-bold text-muted uppercase">Size</label>
                        <input
                          type="text"
                          value={v.label}
                          onChange={(e) => handleUpdateEditingVariant(v.id, { label: e.target.value })}
                          className="w-full px-2 py-1 rounded bg-white border border-sand text-xs font-semibold"
                        />
                      </div>
                      <div className="col-span-3">
                        <label className="block text-[9px] font-bold text-muted uppercase">SKU</label>
                        <input
                          type="text"
                          value={v.sku || ""}
                          onChange={(e) => handleUpdateEditingVariant(v.id, { sku: e.target.value })}
                          className="w-full px-2 py-1 rounded bg-white border border-sand text-xs font-mono"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[9px] font-bold text-muted uppercase">Price ₹</label>
                        <input
                          type="number"
                          value={v.price}
                          onChange={(e) =>
                            handleUpdateEditingVariant(v.id, { price: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full px-2 py-1 rounded bg-white border border-sand text-xs font-bold text-right"
                        />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-[9px] font-bold text-muted uppercase">MRP ₹</label>
                        <input
                          type="number"
                          value={v.mrp || Math.round(v.price * 1.25)}
                          onChange={(e) =>
                            handleUpdateEditingVariant(v.id, { mrp: parseFloat(e.target.value) || 0 })
                          }
                          className="w-full px-2 py-1 rounded bg-white border border-sand text-xs font-bold text-right"
                        />
                      </div>
                      <div className="col-span-2 text-right">
                        <label className="block text-[9px] font-bold text-muted uppercase">Stock</label>
                        <div className="flex items-center gap-1 justify-end">
                          <input
                            type="number"
                            value={v.stock}
                            onChange={(e) =>
                              handleUpdateEditingVariant(v.id, { stock: parseInt(e.target.value, 10) || 0 })
                            }
                            className="w-12 px-1 py-1 rounded bg-white border border-sand text-xs font-bold text-center"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemoveVariantFromEditingProduct(v.id)}
                            className="text-red-600 hover:text-red-800 p-1 cursor-pointer"
                            title="Remove variant"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-sand">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="px-5 py-2.5 rounded-xl border border-sand bg-white text-xs font-semibold text-charcoal cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEditedProduct}
                disabled={savingProductEdit}
                className="px-6 py-2.5 rounded-xl bg-[#184D3B] hover:bg-[#12382B] text-white text-xs font-bold transition cursor-pointer disabled:opacity-50"
              >
                {savingProductEdit ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Stock Tool Modal */}
      {showBulkStockModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-sand pb-3">
              <h3 className="font-editorial text-xl font-bold text-charcoal flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-sage" /> Bulk Stock Modifier
              </h3>
              <button
                type="button"
                onClick={() => setShowBulkStockModal(false)}
                className="p-1 rounded-full hover:bg-sand/40 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-charcoal uppercase mb-1">Target Category</label>
                <select
                  value={bulkStockCategory}
                  onChange={(e) => setBulkStockCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-oat border border-sand cursor-pointer font-semibold"
                >
                  <option value="all">All Categories ({totalVariants} Variants)</option>
                  {BRAND.categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-charcoal uppercase mb-1">Stock Action</label>
                <select
                  value={bulkStockAction}
                  onChange={(e) => setBulkStockAction(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl bg-oat border border-sand cursor-pointer font-semibold"
                >
                  <option value="restock_low">Restock only Low Stock items (&lt; 15 units)</option>
                  <option value="set_all">Set exact stock level for all items</option>
                  <option value="add_all">Add stock to existing counts</option>
                  <option value="zero_out">Zero out stock (Mark Sold Out)</option>
                </select>
              </div>

              {bulkStockAction !== "zero_out" && (
                <div>
                  <label className="block font-bold text-charcoal uppercase mb-1">Units Amount</label>
                  <input
                    type="number"
                    min="1"
                    value={bulkStockAmount}
                    onChange={(e) => setBulkStockAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-cream border border-sand font-bold text-charcoal"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-sand">
              <button
                type="button"
                onClick={() => setShowBulkStockModal(false)}
                className="px-4 py-2 rounded-xl border border-sand bg-white text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkModifyStock}
                className="px-5 py-2 rounded-xl bg-[#184D3B] hover:bg-[#12382B] text-white text-xs font-bold cursor-pointer"
              >
                Apply to Drafts
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPI Screenshot Preview Modal */}
      {previewScreenshotUrl && (
        <div
          onClick={() => setPreviewScreenshotUrl(null)}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-sand pb-3">
              <h3 className="font-editorial text-lg font-bold text-charcoal">
                Customer UPI Payment Proof
              </h3>
              <button
                type="button"
                onClick={() => setPreviewScreenshotUrl(null)}
                className="p-1 rounded-full hover:bg-sand/40 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto flex items-center justify-center bg-black/5 rounded-2xl p-2">
              <img
                src={previewScreenshotUrl}
                alt="Payment proof screenshot"
                className="max-h-[65vh] object-contain rounded-xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
