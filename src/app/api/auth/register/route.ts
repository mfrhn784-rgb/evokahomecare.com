import { NextRequest, NextResponse } from "next/server";
import {
  hashPassword,
  normalizePhone,
  setCustomerSessionCookie,
} from "@/lib/customer-auth";
import {
  getCustomerUserByPhone,
  upsertCustomerUser,
  verifyCustomerOtp,
} from "@/lib/store-db";
import { CustomerUser } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name || "").trim();
    const rawPhone = String(body.phone || "").trim();
    const phone = normalizePhone(rawPhone);
    const email = body.email ? String(body.email).trim().toLowerCase() : undefined;
    const password = body.password ? String(body.password) : undefined;
    const otp = body.otp ? String(body.otp).trim() : undefined;

    if (!name || name.length < 2) {
      return NextResponse.json(
        { ok: false, error: "Please enter your full name (minimum 2 characters)." },
        { status: 400 }
      );
    }

    if (!phone || phone.length !== 10) {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    // Verify OTP if provided or required
    if (otp) {
      const isValidOtp = await verifyCustomerOtp(phone, otp);
      if (!isValidOtp) {
        return NextResponse.json(
          { ok: false, error: "Invalid or expired OTP. Please try again or request a new code." },
          { status: 401 }
        );
      }
    } else if (!password) {
      return NextResponse.json(
        { ok: false, error: "Please provide either an OTP code or set a password." },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await getCustomerUserByPhone(phone);
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "An account with this phone number already exists. Please log in." },
        { status: 409 }
      );
    }

    let passwordHash: string | undefined;
    if (password && password.length >= 6) {
      passwordHash = await hashPassword(password);
    }

    const newUser: CustomerUser = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name,
      phone,
      email,
      passwordHash,
      addresses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await upsertCustomerUser(newUser);

    const res = NextResponse.json({
      ok: true,
      message: "Account created successfully! Welcome to EVOKA.",
      user: {
        id: newUser.id,
        name: newUser.name,
        phone: newUser.phone,
        email: newUser.email,
        addresses: newUser.addresses,
      },
    });

    setCustomerSessionCookie(res, {
      userId: newUser.id,
      phone: newUser.phone,
      name: newUser.name,
      email: newUser.email,
    });

    return res;
  } catch (err: any) {
    console.error("Register error:", err);
    return NextResponse.json(
      { ok: false, error: "Registration failed. Please try again." },
      { status: 500 }
    );
  }
}
