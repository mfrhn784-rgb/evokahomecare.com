import { Order } from "./types";

const PROFILE_KEY = "evoka_customer_profile_v1";
const ORDERS_KEY = "evoka_saved_orders_v1";
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
    notifyUpdate();
  } catch {
    // ignore
  }
}

export function loadSavedOrders(): SavedOrderRef[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as SavedOrderRef[]) : [];
  } catch {
    return [];
  }
}

export function saveOrderRef(order: Order): void {
  if (typeof window === "undefined") return;
  try {
    const current = loadSavedOrders().filter((o) => o.id !== order.id);
    const entry: SavedOrderRef = {
      id: order.id,
      createdAt: order.createdAt,
      total: order.total,
      status: order.status,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      itemCount: order.items.reduce((sum, i) => sum + i.quantity, 0),
      firstItemName: order.items[0]?.name || "EVOKA Order",
      phone: order.phone.replace(/\D/g, "").slice(-10),
    };
    const next = [entry, ...current].slice(0, 20);
    localStorage.setItem(ORDERS_KEY, JSON.stringify(next));
    notifyUpdate();
  } catch {
    // ignore
  }
}

export function syncSavedOrdersStatus(liveOrders: Order[]): void {
  if (typeof window === "undefined" || liveOrders.length === 0) return;
  try {
    const current = loadSavedOrders();
    const map = new Map(liveOrders.map((o) => [o.id, o]));
    let changed = false;

    const updated = current.map((ref) => {
      const live = map.get(ref.id);
      if (!live) return ref;
      if (live.status !== ref.status || live.paymentStatus !== ref.paymentStatus) {
        changed = true;
        return { ...ref, status: live.status, paymentStatus: live.paymentStatus };
      }
      return ref;
    });

    // Also include any live orders not yet in local list
    for (const live of liveOrders) {
      if (!updated.some((u) => u.id === live.id)) {
        changed = true;
        updated.push({
          id: live.id,
          createdAt: live.createdAt,
          total: live.total,
          status: live.status,
          paymentMethod: live.paymentMethod,
          paymentStatus: live.paymentStatus,
          itemCount: live.items.reduce((sum, i) => sum + i.quantity, 0),
          firstItemName: live.items[0]?.name || "EVOKA Order",
          phone: live.phone.replace(/\D/g, "").slice(-10),
        });
      }
    }

    if (changed) {
      updated.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      localStorage.setItem(ORDERS_KEY, JSON.stringify(updated.slice(0, 20)));
      notifyUpdate();
    }
  } catch {
    // ignore
  }
}
