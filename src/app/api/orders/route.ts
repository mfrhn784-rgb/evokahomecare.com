import { NextRequest, NextResponse } from "next/server";
import {
  createVerifiedOrder,
  customerModifyOrder,
  getOrderById,
  getOrders,
  updateOrderByAdmin,
} from "@/lib/store-db";
import { verifyAdminSession } from "@/lib/admin-auth";
import { BRAND, COUPONS } from "@/lib/brand";
import { Order } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("id")?.trim();
  const phone = searchParams.get("phone")?.replace(/\D/g, "");

  if (verifyAdminSession(req)) {
    if (orderId) {
      const order = await getOrderById(orderId);
      return order
        ? NextResponse.json({ order })
        : NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ orders: await getOrders() });
  }

  // Customer lookup: requires phone verification when fetching by ID, or matches last 10 digits
  if (orderId && phone && phone.length >= 10) {
    const order = await getOrderById(orderId);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.phone.replace(/\D/g, "").slice(-10) !== phone.slice(-10)) {
      return NextResponse.json(
        { error: "Phone number does not match this Order ID." },
        { status: 403 }
      );
    }
    return NextResponse.json({ order });
  }

  if (phone && phone.length >= 10) {
    const orders = (await getOrders()).filter(
      (o) => o.phone.replace(/\D/g, "").slice(-10) === phone.slice(-10)
    );
    return NextResponse.json({ orders });
  }

  if (orderId) {
    const order = await getOrderById(orderId);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    // Mask sensitive street details unless phone is verified
    return NextResponse.json({
      order: {
        ...order,
        address: {
          ...order.address,
          line1: "Verified mobile number required to view/edit full street address",
        },
      },
      requiresPhoneVerification: true,
    });
  }

  return NextResponse.json(
    { error: "Enter your Order ID and mobile number to view your orders." },
    { status: 400 }
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const customerName = String(body.customerName || "").trim();
    const phoneRaw = String(body.phone || "").trim();
    const digits = phoneRaw.replace(/\D/g, "");

    if (!customerName || customerName.length < 2) {
      return NextResponse.json({ error: "Please enter your full name." }, { status: 400 });
    }
    if (digits.length < 10) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit mobile / WhatsApp number." },
        { status: 400 }
      );
    }
    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "Your cart is empty." }, { status: 400 });
    }

    const isPickup = body.fulfillmentType === "pickup";
    const pincode = String(body.address?.pincode || "").trim();
    if (!isPickup) {
      if (!String(body.address?.line1 || "").trim()) {
        return NextResponse.json({ error: "Delivery street address is required." }, { status: 400 });
      }
      if (!/^\d{6}$/.test(pincode)) {
        return NextResponse.json({ error: "Please enter a valid 6-digit PIN code." }, { status: 400 });
      }
    }

    const email = String(body.email || "").trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }

    const paymentMethod =
      body.paymentMethod === "upi"
        ? "upi"
        : body.paymentMethod === "whatsapp"
        ? "whatsapp"
        : "cod";

    const upiReference = String(body.upiReference || "").trim();
    if (paymentMethod === "upi" && upiReference.length < 4) {
      return NextResponse.json(
        { error: "Please enter a valid UPI Transaction Reference / UTR number." },
        { status: 400 }
      );
    }

    const paymentScreenshot = body.paymentScreenshot
      ? String(body.paymentScreenshot).trim()
      : undefined;
    const clientRequestId = body.clientRequestId
      ? String(body.clientRequestId).trim()
      : undefined;

    const code = typeof body.couponCode === "string" ? body.couponCode.trim().toUpperCase() : "";

    const result = await createVerifiedOrder(({ items, subtotal }) => {
      let discount = 0;
      if (code && COUPONS[code] && subtotal >= COUPONS[code].minOrder) {
        discount = Math.round((subtotal * COUPONS[code].discountPercent) / 100);
      }
      const afterDiscount = Math.max(0, subtotal - discount);
      const shippingFee = 0; // Free Delivery across all orders
      const total = afterDiscount + shippingFee;

      const order: Order = {
        id: `EVK-${Date.now().toString().slice(-6)}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
        clientRequestId,
        createdAt: new Date().toISOString(),
        customerName,
        phone: phoneRaw,
        email,
        fulfillmentType: isPickup ? "pickup" : "delivery",
        pickupOutlet: isPickup ? String(body.pickupOutlet || BRAND.outlets[0].name) : undefined,
        address: {
          line1: String(body.address?.line1 || (isPickup ? "Store Pickup" : "")).trim(),
          landmark: String(body.address?.landmark || "").trim(),
          city: String(body.address?.city || "Thiruvananthapuram").trim(),
          state: String(body.address?.state || "Kerala").trim(),
          pincode,
        },
        items: items.length ? items : body.items,
        subtotal,
        discount,
        couponCode: discount > 0 ? code : undefined,
        shippingFee,
        total,
        paymentMethod,
        paymentStatus:
          paymentMethod === "upi"
            ? "PAYMENT_UNDER_REVIEW"
            : paymentMethod === "cod"
            ? "NOT_PAID"
            : "Pending",
        upiReference: paymentMethod === "upi" ? upiReference : undefined,
        paymentScreenshot: paymentMethod === "upi" ? paymentScreenshot : undefined,
        status: "PENDING_CONFIRMATION",
        notes: body.notes ? String(body.notes).trim() : undefined,
      };
      return order;
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json(
      { order: result.order, duplicate: Boolean(result.duplicate) },
      { status: result.duplicate ? 200 : 201 }
    );
  } catch {
    return NextResponse.json({ error: "Could not place order. Please check your details." }, { status: 400 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();

    // Customer self-service: cancel or edit address/notes (verified by Order ID + matching phone)
    if (body.customerAction === "cancel" || body.customerAction === "update_address") {
      if (!body.orderId || !body.phone) {
        return NextResponse.json(
          { error: "Order ID and mobile number are required." },
          { status: 400 }
        );
      }
      const res = await customerModifyOrder(body.orderId, body.phone, body.customerAction, {
        reason: body.reason,
        address: body.address,
        notes: body.notes,
      });
      if (!res.ok) {
        return NextResponse.json({ error: res.error }, { status: 400 });
      }
      return NextResponse.json({ order: res.order });
    }

    // Admin fulfillment control
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const updated = await updateOrderByAdmin(body.orderId, {
      adminAction: body.adminAction,
      reason: body.reason,
      status: body.status,
      paymentStatus: body.paymentStatus,
      trackingNumber: body.trackingNumber,
      courierName: body.courierName,
    });
    if (!updated) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    return NextResponse.json({ order: updated });
  } catch {
    return NextResponse.json({ error: "Invalid update request." }, { status: 400 });
  }
}
