import { NextRequest, NextResponse } from "next/server";
import {
  normalizePhone,
  setCustomerSessionCookie,
  verifyPassword,
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
    const rawPhone = String(body.phone || "").trim();
    const phone = normalizePhone(rawPhone);
    const otp = body.otp ? String(body.otp).trim() : undefined;
    const password = body.password ? String(body.password) : undefined;

    if (!phone || phone.length !== 10) {
      return NextResponse.json(
        { ok: false, error: "Please enter a valid 10-digit mobile number." },
        { status: 400 }
      );
    }

    let user = await getCustomerUserByPhone(phone);

    // Method 1: OTP Authentication
    if (otp) {
      const isValid = await verifyCustomerOtp(phone, otp);
      if (!isValid) {
        return NextResponse.json(
          { ok: false, error: "Invalid or expired OTP. Please check the code or request a new one." },
          { status: 401 }
        );
      }

      // If user doesn't exist yet, auto-provision an account for frictionless experience
      if (!user) {
        user = {
          id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: body.name ? String(body.name).trim() : `Customer ${phone.slice(-4)}`,
          phone,
          addresses: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await upsertCustomerUser(user);
      }
    }
    // Method 2: Password Authentication
    else if (password) {
      if (!user || !user.passwordHash) {
        return NextResponse.json(
          { ok: false, error: "No password set for this account. Please log in with OTP." },
          { status: 400 }
        );
      }

      const isMatch = await verifyPassword(password, user.passwordHash);
      if (!isMatch) {
        return NextResponse.json(
          { ok: false, error: "Incorrect password. Please try again or use OTP." },
          { status: 401 }
        );
      }
    } else {
      return NextResponse.json(
        { ok: false, error: "Please enter either your OTP or account password." },
        { status: 400 }
      );
    }

    const res = NextResponse.json({
      ok: true,
      message: `Welcome back, ${user.name}!`,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        addresses: user.addresses || [],
        defaultAddressId: user.defaultAddressId,
      },
    });

    setCustomerSessionCookie(res, {
      userId: user.id,
      phone: user.phone,
      name: user.name,
      email: user.email,
    });

    return res;
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json(
      { ok: false, error: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}
