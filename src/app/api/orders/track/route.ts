import { NextRequest, NextResponse } from "next/server";
import { getOrderById } from "@/lib/store-db";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, private, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

const GENERIC_ERROR = "No matching order found for the provided Order ID and mobile number.";

/**
 * Public Customer Order Tracking Endpoint
 *
 * SECURITY GUARANTEES:
 * 1. ZERO Admin Session Interception: Never checks or respects admin cookies or admin tokens.
 * 2. Strict Dual-Credential Ownership: Requires BOTH Order ID AND 10-digit registered phone number.
 * 3. Never returns order lists or customer directories (returns at most 1 verified order).
 * 4. Offline counter orders are strictly excluded.
 * 5. Generic errors prevent phone or Order ID enumeration.
 * 6. Strict Cache-Control: no-store prevents intermediate or browser caching.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("id")?.trim() || "";
  const phone = (searchParams.get("phone") || "").replace(/\D/g, "").slice(-10);

  if (!orderId || !phone || phone.length < 10) {
    return NextResponse.json(
      { error: "Both Order ID and your registered 10-digit mobile number are required to track your order." },
      { status: 400, headers: NO_STORE_HEADERS }
    );
  }

  const order = await getOrderById(orderId);

  // Reject if order doesn't exist or is an offline counter transaction
  if (!order || order.channel === "offline") {
    return NextResponse.json(
      { error: GENERIC_ERROR },
      { status: 404, headers: NO_STORE_HEADERS }
    );
  }

  const orderPhone = order.phone.replace(/\D/g, "").slice(-10);
  if (orderPhone !== phone) {
    // Return identical generic 404 error without leaking whether the ID or phone exists
    return NextResponse.json(
      { error: GENERIC_ERROR },
      { status: 404, headers: NO_STORE_HEADERS }
    );
  }

  // Return ONLY the single verified customer order
  return NextResponse.json({ order }, { headers: NO_STORE_HEADERS });
}
