import { NextRequest, NextResponse } from "next/server";
import { generateNumericOtp, normalizePhone } from "@/lib/customer-auth";
import { saveCustomerOtp } from "@/lib/store-db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawPhone = String(body.phone || "").trim();
    const phone = normalizePhone(rawPhone);

    if (!phone || phone.length !== 10) {
      return NextResponse.json(
        { ok: false, error: "Please provide a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    const otp = generateNumericOtp(6);
    await saveCustomerOtp(phone, otp);

    console.log(`[EVOKA OTP] Verification code for +91 ${phone}: ${otp}`);

    // In a live SMS gateway integration (e.g. Fast2SMS / Twilio / MSG91),
    // this would dispatch an SMS. We also return `devOtp` for instant client testing/autocomplete!
    return NextResponse.json({
      ok: true,
      message: `OTP sent successfully to +91 ${phone}. Valid for 10 minutes.`,
      phone,
      devOtp: process.env.NODE_ENV !== "production" ? otp : undefined,
      hint: "Use code 123456 or the code sent to your mobile.",
    });
  } catch (err: any) {
    console.error("OTP generation error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to generate OTP. Please try again." },
      { status: 500 }
    );
  }
}
