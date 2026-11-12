export type CategorySlug = string;

export interface ProductVariant {
  id: string;
  label: string; // e.g. "500 ml Bottle", "1 L Bottle", "2 L Refill Pouch"
  price: number; // Selling price in INR
  mrp: number; // MRP in INR
  stock: number;
  sku: string;
  image?: string; // Optional per-variant image path
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: CategorySlug;
  categoryName: string;
  subcategory?: string;
  shortTagline: string;
  description: string;
  scent: string;
  keyIngredients: string[];
  freeFrom: string[];
  howToUse: string;
  image: string;
  badge?: string; // e.g. "Best Seller", "Refill & Save", "New"
  rating: number;
  reviewCount: number;
  isFeatured?: boolean;
  isEcoRefill?: boolean;
  variants: ProductVariant[];
}

export interface CartItem {
  productId: string;
  variantId: string;
  name: string;
  variantLabel: string;
  price: number;
  mrp: number;
  image: string;
  quantity: number;
  slug: string;
}

export type OrderStatus =
  | "Pending"
  | "Confirmed"
  | "Packed"
  | "Shipped"
  | "Delivered"
  | "Cancelled";

export type PaymentMethod = "razorpay" | "cod" | "whatsapp";
export type PaymentStatus = "Pending" | "Paid" | "Paid (Test/Razorpay)" | "COD" | "Refunded";

export interface Order {
  id: string;
  createdAt: string;
  updatedAt?: string;
  customerName: string;
  phone: string;
  email: string;
  fulfillmentType: "delivery" | "pickup";
  pickupOutlet?: string;
  address: {
    line1: string;
    landmark?: string;
    city: string;
    state: string;
    pincode: string;
  };
  items: CartItem[];
  subtotal: number;
  discount: number;
  couponCode?: string;
  shippingFee: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentId?: string;
  status: OrderStatus;
  trackingNumber?: string;
  courierName?: string;
  cancellationReason?: string;
  notes?: string;
}
