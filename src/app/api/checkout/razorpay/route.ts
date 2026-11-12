import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

/**
 * Creates a Razorpay order when RAZORPAY_KEY_ID & RAZORPAY_KEY_SECRET are configured.
 * Otherwise runs cleanly in Test/Demo mode so the storefront can be tested immediately.
 */
export async function POST(req: NextRequest) {
  try {
    const { amountInRupees } = (await req.json()) as { amountInRupees: number };
    const amountPaise = Math.max(100, Math.round(Number(amountInRupees) * 100));

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json({
        mode: "demo",
        orderId: `demo_rzp_${Date.now()}`,
        amount: amountPaise,
        currency: "INR",
      });
    }

    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: "INR",
        receipt: `evoka_${Date.now()}`,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `Razorpay error: ${text}` }, { status: 502 });
    }

    const data = await res.json();
    return NextResponse.json({
      mode: "live",
      keyId,
      orderId: data.id,
      amount: data.amount,
      currency: data.currency,
    });
  } catch {
    return NextResponse.json({ error: "Failed to initiate Razorpay order" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return NextResponse.json({ verified: true, mode: "demo" });
  }
  const expected = crypto
    .createHmac("sha256", keySecret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  return NextResponse.json({ verified: expected === razorpay_signature });
}
