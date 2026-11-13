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

export interface CustomerAddress {
  id: string;
  label: "Home" | "Work" | "Other" | string;
  line1: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface CustomerUser {
  id: string; // e.g. "usr_..."
  name: string;
  phone: string; // normalized 10 digits
  email?: string;
  passwordHash?: string; // salt$hash
  addresses: CustomerAddress[];
  defaultAddressId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AuthSession {
  userId: string;
  phone: string;
  name: string;
  email?: string;
}

export interface PendingOtp {
  phone: string;
  otp: string;
  expiresAt: number; // timestamp ms
  createdAt: number;
}

export interface PromoCoupon {
  code: string;
  discountPercent: number;
  minOrder: number;
  description?: string;
  active: boolean;
  createdAt?: string;
}

export type OrderStatus =
  | "PENDING_CONFIRMATION"
  | "Pending"
  | "Confirmed"
  | "Packed"
  | "Shipped"
  | "Delivered"
  | "Cancelled";

export type PaymentMethod = "upi" | "cod" | "whatsapp" | "razorpay";
export type PaymentStatus =
  | "PAYMENT_UNDER_REVIEW"
  | "PAID"
  | "REJECTED"
  | "NOT_PAID"
  | "Pending"
  | "Paid"
  | "Paid (Test/Razorpay)"
  | "COD"
  | "Refunded";

export interface OrderInvoice {
  invoiceNumber: string;
  generatedAt: string;
  subtotal: number;
  discount: number;
  shippingFee: number;
  taxRatePercent: number;
  taxAmount: number;
  total: number;
  paymentMethod: string;
  paymentStatus: string;
}

export interface Order {
  id: string;
  userId?: string;
  clientRequestId?: string;
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
  upiReference?: string;
  paymentScreenshot?: string;
  paymentVerifiedAt?: string;
  paymentRejectedReason?: string;
  invoice?: OrderInvoice;
  status: OrderStatus;
  trackingNumber?: string;
  courierName?: string;
  cancellationReason?: string;
  notes?: string;
}
