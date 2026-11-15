import { Order } from "./types";

const PROFILE_KEY = "evoka_customer_profile_v1";
export const EVOKA_STORAGE_EVENT = "evoka-customer-storage-updated";

export interface SavedCustomerProfile {
  customerName: string;
  phone: string;
  email: string;
  fulfillmentType: "delivery" | "pickup";
  pickupOutlet: string;
  line1: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  notes: string;
  paymentMethod: "upi" | "cod";
  updatedAt: string;
}

export interface SavedOrderRef {
  id: string;
  createdAt: string;
  total: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  itemCount: number;
  firstItemName: string;
  phone: string;
}

function notifyUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(EVOKA_STORAGE_EVENT));
  }
}

/**
 * CRITICAL PRIVACY FIX:
 * Purges all device-wide order history from browser localStorage to prevent
 * exposing one customer's orders to subsequent visitors on the same device.
 */
export function purgeDeviceOrderHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem("evoka_saved_orders_v1");
    localStorage.removeItem("evoka_saved_orders");
    localStorage.removeItem("evoka_recent_orders");
  } catch {
    // ignore
  }
}

// Auto-purge legacy shared order records on client load
if (typeof window !== "undefined") {
  try {
    purgeDeviceOrderHistory();
  } catch {
    // ignore
  }
}

export function loadSavedProfile(): SavedCustomerProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedCustomerProfile;
  } catch {
    return null;
  }
}

export function saveCustomerProfile(partial: Partial<SavedCustomerProfile>): void {
  if (typeof window === "undefined") return;
  try {
    const existing = loadSavedProfile();
    const merged: SavedCustomerProfile = {
      customerName: "",
      phone: "",
      email: "",
      fulfillmentType: "delivery",
      pickupOutlet: "",
      line1: "",
      landmark: "",
      city: "Thiruvananthapuram",
      state: "Kerala",
      pincode: "",
      notes: "",
      paymentMethod: "upi",
      ...existing,
      ...partial,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(merged));
    notifyUpdate();
  } catch {
    // ignore storage quota errors
  }
}

export function clearSavedProfile(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(PROFILE_KEY);
    purgeDeviceOrderHistory();
    notifyUpdate();
  } catch {
    // ignore
  }
}

/**
 * Privacy safe no-ops: Orders are NEVER persisted to device-wide browser localStorage.
 * Every customer order lookup requires verified Order ID + Mobile Number verified server-side.
 */
export function loadSavedOrders(): SavedOrderRef[] {
  return [];
}

export function saveOrderRef(_order: Order): void {
  // Purposely no-op for customer privacy across shared devices & browsers
  purgeDeviceOrderHistory();
}

export function syncSavedOrdersStatus(_liveOrders: Order[]): void {
  // Purposely no-op for customer privacy across shared devices & browsers
  purgeDeviceOrderHistory();
}
