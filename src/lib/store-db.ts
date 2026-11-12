import fs from "fs";
import path from "path";
import { Order, OrderInvoice, PaymentStatus, Product } from "./types";
import { SEED_PRODUCTS } from "./seed-products";
import { BRAND } from "./brand";
import { getEvokaBlobStore, isBlobsRuntime } from "./netlify-blobs-helper";

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "store.json");
const BLOB_STORE_NAME = "evoka-store";

interface StoreData {
  products: Product[];
  orders: Order[];
  invoiceSeq?: number;
}

function readLocalSeed(): StoreData {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, "utf-8");
      const parsed = JSON.parse(raw) as StoreData;
      return {
        products:
          Array.isArray(parsed.products) && parsed.products.length > 0
            ? parsed.products
            : SEED_PRODUCTS,
        orders: Array.isArray(parsed.orders) ? parsed.orders : [],
        invoiceSeq: typeof parsed.invoiceSeq === "number" ? parsed.invoiceSeq : 0,
      };
    }
  } catch {
    // Fallback cleanly to bundled seed catalog
  }
  return {
    products: SEED_PRODUCTS,
    orders: [],
    invoiceSeq: 0,
  };
}

function writeLocalStore(data: StoreData): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf-8");
}

function ensureLocalStore(): StoreData {
  if (!fs.existsSync(STORE_PATH)) {
    const initial: StoreData = { products: SEED_PRODUCTS, orders: [] };
    writeLocalStore(initial);
    return initial;
  }
  return readLocalSeed();
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Store operation timed out after ${ms}ms`)), ms)
    ),
  ]);
}

async function readStore(): Promise<StoreData> {
  if (isBlobsRuntime()) {
    try {
      const store = getEvokaBlobStore(BLOB_STORE_NAME, true);
      const [products, orders, invoiceSeq] = await withTimeout(
        Promise.all([
          store.get("products", { type: "json" }) as Promise<Product[] | null>,
          store.get("orders", { type: "json" }) as Promise<Order[] | null>,
          store.get("invoiceSeq", { type: "json" }) as Promise<number | null>,
        ]),
        4000
      );

      const seed = readLocalSeed();
      return {
        products: Array.isArray(products) && products.length > 0 ? products : seed.products,
        orders: Array.isArray(orders) ? orders : seed.orders,
        invoiceSeq: typeof invoiceSeq === "number" ? invoiceSeq : seed.invoiceSeq || 0,
      };
    } catch {
      return readLocalSeed();
    }
  }

  return ensureLocalStore();
}

async function writeProductsStore(products: Product[]): Promise<void> {
  if (isBlobsRuntime()) {
    const store = getEvokaBlobStore(BLOB_STORE_NAME, true);
    await store.setJSON("products", products);
    return;
  }
  const current = ensureLocalStore();
  current.products = products;
  writeLocalStore(current);
}

async function writeFullStore(data: StoreData): Promise<void> {
  if (isBlobsRuntime()) {
    const store = getEvokaBlobStore(BLOB_STORE_NAME, true);
    await Promise.all([
      store.setJSON("products", data.products),
      store.setJSON("orders", data.orders),
      store.setJSON("invoiceSeq", data.invoiceSeq || 0),
    ]);
    return;
  }
  writeLocalStore(data);
}

export async function getProducts(): Promise<Product[]> {
  const store = await readStore();
  return store.products;
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  const products = await getProducts();
  return products.find((p) => p.slug === slug);
}

export async function saveProducts(products: Product[]): Promise<Product[]> {
  await writeProductsStore(products);
  return products;
}

export async function upsertProduct(product: Product): Promise<Product[]> {
  const store = await readStore();
  const idx = store.products.findIndex((p) => p.id === product.id || p.slug === product.slug);
  if (idx >= 0) {
    store.products[idx] = product;
  } else {
    store.products.unshift(product);
  }
  await writeProductsStore(store.products);
  return store.products;
}

export async function deleteProduct(id: string): Promise<Product[]> {
  const store = await readStore();
  store.products = store.products.filter((p) => p.id !== id);
  await writeProductsStore(store.products);
  return store.products;
}

export async function resetInventoryToSeed(): Promise<Product[]> {
  const store = await readStore();
  // Deep clone seed products with pristine default stock (50 each)
  const resetProducts: Product[] = JSON.parse(JSON.stringify(SEED_PRODUCTS));
  store.products = resetProducts;
  await writeProductsStore(resetProducts);
  return resetProducts;
}

export async function bulkModifyStock(action: {
  type: "set_all" | "add_all" | "restock_low" | "zero_out";
  amount?: number;
  threshold?: number;
  category?: string;
}): Promise<Product[]> {
  const store = await readStore();
  const amt = Math.max(0, Math.floor(action.amount ?? 50));
  const thresh = action.threshold ?? 15;

  for (const prod of store.products) {
    if (action.category && action.category !== "all" && prod.category !== action.category) {
      continue;
    }
    for (const v of prod.variants) {
      if (action.type === "set_all") {
        v.stock = amt;
      } else if (action.type === "add_all") {
        v.stock = Math.max(0, v.stock + amt);
      } else if (action.type === "restock_low") {
        if (v.stock < thresh) {
          v.stock = amt;
        }
      } else if (action.type === "zero_out") {
        v.stock = 0;
      }
    }
  }

  await writeProductsStore(store.products);
  return store.products;
}

export async function getOrders(): Promise<Order[]> {
  const store = await readStore();
  return store.orders;
}

export async function getOrderById(id: string): Promise<Order | undefined> {
  const orders = await getOrders();
  return orders.find((o) => o.id.toLowerCase() === id.toLowerCase());
}

/**
 * Validates submitted items against live catalog prices & stock, then persists the order.
 */
export async function createVerifiedOrder(
  buildOrder: (verified: {
    items: Order["items"];
    subtotal: number;
  }) => Order
): Promise<{ ok: true; order: Order; duplicate?: boolean } | { ok: false; error: string }> {
  const store = await readStore();
  const draft = buildOrder({ items: [], subtotal: 0 });

  // Idempotency guard: prevent duplicate submissions for the same checkout request
  if (draft.clientRequestId) {
    const existing = store.orders.find((o) => o.clientRequestId === draft.clientRequestId);
    if (existing) {
      return { ok: true, order: existing, duplicate: true };
    }
  }

  const verifiedItems: Order["items"] = [];
  let subtotal = 0;

  for (const requested of draft.items) {
    const prod = store.products.find((p) => p.id === requested.productId);
    if (!prod) {
      return { ok: false, error: `Product "${requested.name}" is no longer available.` };
    }
    const variant = prod.variants.find((v) => v.id === requested.variantId);
    if (!variant) {
      return { ok: false, error: `Selected pack for "${prod.name}" is unavailable.` };
    }
    const qty = Math.floor(Number(requested.quantity));
    if (!Number.isFinite(qty) || qty < 1 || qty > 50) {
      return { ok: false, error: `Invalid quantity for "${prod.name}".` };
    }
    if (variant.stock < qty) {
      return {
        ok: false,
        error: `Only ${variant.stock} unit(s) left in stock for ${prod.name} (${variant.label}).`,
      };
    }

    verifiedItems.push({
      productId: prod.id,
      variantId: variant.id,
      name: prod.name,
      variantLabel: variant.label,
      price: variant.price,
      mrp: variant.mrp,
      image: prod.image,
      slug: prod.slug,
      quantity: qty,
    });
    subtotal += variant.price * qty;
  }

  const order = buildOrder({ items: verifiedItems, subtotal });

  for (const item of verifiedItems) {
    const prod = store.products.find((p) => p.id === item.productId);
    const variant = prod?.variants.find((v) => v.id === item.variantId);
    if (variant) {
      variant.stock = Math.max(0, variant.stock - item.quantity);
    }
  }

  store.orders.unshift(order);
  await writeFullStore(store);
  return { ok: true, order };
}

function restoreStock(store: StoreData, order: Order) {
  for (const item of order.items) {
    const prod = store.products.find((p) => p.id === item.productId);
    const variant = prod?.variants.find((v) => v.id === item.variantId);
    if (variant) {
      variant.stock += item.quantity;
    }
  }
}

export async function updateOrderByAdmin(
  orderId: string,
  updates: {
    adminAction?: "verify_payment" | "reject_payment" | "confirm_cod";
    reason?: string;
    status?: Order["status"];
    paymentStatus?: PaymentStatus;
    trackingNumber?: string;
    courierName?: string;
  }
): Promise<Order | null> {
  const store = await readStore();
  const order = store.orders.find((o) => o.id === orderId);
  if (!order) return null;

  const wasCancelled = order.status === "Cancelled";

  if (updates.adminAction === "verify_payment") {
    order.paymentStatus = "PAID";
    order.paymentVerifiedAt = new Date().toISOString();
    order.paymentRejectedReason = undefined;
    if (order.status === "PENDING_CONFIRMATION" || order.status === "Pending") {
      order.status = "Confirmed";
    }
  } else if (updates.adminAction === "reject_payment") {
    order.paymentStatus = "REJECTED";
    order.paymentRejectedReason =
      updates.reason?.trim() || "Payment could not be verified against received funds.";
    if (!wasCancelled) {
      restoreStock(store, order);
    }
    order.status = "Cancelled";
    order.cancellationReason = order.paymentRejectedReason;
  } else if (updates.adminAction === "confirm_cod") {
    if (order.status === "PENDING_CONFIRMATION" || order.status === "Pending") {
      order.status = "Confirmed";
    }
  }

  if (updates.status) {
    if (updates.status === "Cancelled" && !wasCancelled && order.status !== "Cancelled") {
      restoreStock(store, order);
    }
    order.status = updates.status;
  }
  if (updates.paymentStatus) order.paymentStatus = updates.paymentStatus;
  if (typeof updates.trackingNumber === "string") order.trackingNumber = updates.trackingNumber.trim();
  if (typeof updates.courierName === "string") order.courierName = updates.courierName.trim();
  order.updatedAt = new Date().toISOString();

  await writeFullStore(store);
  return order;
}

export function isOrderEligibleForInvoice(order: Order): { eligible: boolean; reason?: string } {
  if (order.status === "Cancelled") {
    return { eligible: false, reason: "Cancelled orders cannot have a final invoice." };
  }
  if (order.paymentStatus === "REJECTED") {
    return { eligible: false, reason: "Rejected payment orders cannot be invoiced." };
  }
  if (order.paymentMethod === "upi") {
    const isPaid = order.paymentStatus === "PAID" || order.paymentStatus === "Paid";
    if (!isPaid) {
      return {
        eligible: false,
        reason: "Verify UPI payment against received funds before generating invoice.",
      };
    }
  } else {
    const confirmedStatuses: Order["status"][] = [
      "Confirmed",
      "Packed",
      "Shipped",
      "Delivered",
    ];
    if (!confirmedStatuses.includes(order.status)) {
      return {
        eligible: false,
        reason: "Confirm this COD order before generating an invoice.",
      };
    }
  }
  return { eligible: true };
}

export async function generateOrGetOrderInvoice(
  orderId: string
): Promise<
  | { ok: true; order: Order; invoice: OrderInvoice; newlyGenerated: boolean }
  | { ok: false; error: string; status: number }
> {
  const store = await readStore();
  const order = store.orders.find((o) => o.id.toLowerCase() === orderId.toLowerCase());
  if (!order) {
    return { ok: false, error: "Order not found.", status: 404 };
  }

  const eligibility = isOrderEligibleForInvoice(order);
  if (!eligibility.eligible) {
    return {
      ok: false,
      error: eligibility.reason || "Order is not eligible for invoicing.",
      status: 400,
    };
  }

  // Regeneration preserves original invoice number & financial snapshot
  if (order.invoice) {
    return { ok: true, order, invoice: order.invoice, newlyGenerated: false };
  }

  const existingMax = store.orders.reduce((max, o) => {
    const match = o.invoice?.invoiceNumber.match(/(\d+)$/);
    return match ? Math.max(max, parseInt(match[1], 10)) : max;
  }, 0);

  const nextSeq = Math.max(store.invoiceSeq || 0, existingMax) + 1;
  store.invoiceSeq = nextSeq;

  const taxRatePercent = Number.isFinite(BRAND.business.taxRatePercent)
    ? BRAND.business.taxRatePercent
    : 0;
  const taxAmount =
    taxRatePercent > 0
      ? Math.round((order.total - (order.total * 100) / (100 + taxRatePercent)) * 100) / 100
      : 0;

  const invoice: OrderInvoice = {
    invoiceNumber: `EVK-INV-${String(nextSeq).padStart(4, "0")}`,
    generatedAt: new Date().toISOString(),
    subtotal: order.subtotal,
    discount: order.discount,
    shippingFee: order.shippingFee,
    taxRatePercent,
    taxAmount,
    total: order.total,
    paymentMethod:
      order.paymentMethod === "upi"
        ? "UPI Prepaid"
        : order.paymentMethod === "cod"
        ? "Cash on Delivery"
        : order.paymentMethod.toUpperCase(),
    paymentStatus: order.paymentStatus,
  };

  order.invoice = invoice;
  order.updatedAt = new Date().toISOString();
  await writeFullStore(store);

  return { ok: true, order, invoice, newlyGenerated: true };
}

export async function customerModifyOrder(
  orderId: string,
  phone: string,
  action: "cancel" | "update_address",
  payload: {
    reason?: string;
    address?: Order["address"];
    notes?: string;
  }
): Promise<{ ok: true; order: Order } | { ok: false; error: string }> {
  const store = await readStore();
  const order = store.orders.find((o) => o.id.toLowerCase() === orderId.toLowerCase());
  if (!order) return { ok: false, error: "Order not found." };

  const cleanInputPhone = phone.replace(/\D/g, "").slice(-10);
  const cleanOrderPhone = order.phone.replace(/\D/g, "").slice(-10);
  if (!cleanInputPhone || cleanInputPhone !== cleanOrderPhone) {
    return { ok: false, error: "Mobile number does not match this order." };
  }

  if (
    order.status !== "PENDING_CONFIRMATION" &&
    order.status !== "Pending" &&
    order.status !== "Confirmed"
  ) {
    return {
      ok: false,
      error: `Order cannot be modified because it is already "${order.status}". Please contact us on WhatsApp.`,
    };
  }

  if (action === "cancel") {
    order.status = "Cancelled";
    order.cancellationReason = payload.reason?.trim() || "Cancelled by customer";
    restoreStock(store, order);
  } else if (action === "update_address" && payload.address) {
    order.address = {
      line1: String(payload.address.line1 || order.address.line1).trim(),
      landmark: String(payload.address.landmark || "").trim(),
      city: String(payload.address.city || order.address.city).trim(),
      state: String(payload.address.state || order.address.state).trim(),
      pincode: String(payload.address.pincode || order.address.pincode).trim(),
    };
    if (typeof payload.notes === "string") {
      order.notes = payload.notes.trim();
    }
  }

  order.updatedAt = new Date().toISOString();
  await writeFullStore(store);
  return { ok: true, order };
}
