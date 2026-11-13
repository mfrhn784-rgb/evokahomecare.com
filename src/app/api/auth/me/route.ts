import { NextRequest, NextResponse } from "next/server";
import {
  clearCustomerSessionCookie,
  getCustomerSessionFromRequest,
  hashPassword,
  normalizePhone,
  setCustomerSessionCookie,
  verifyPassword,
} from "@/lib/customer-auth";
import {
  getCustomerOrders,
  getCustomerUserById,
  getCustomerUserByPhone,
  upsertCustomerUser,
  verifyCustomerOtp,
} from "@/lib/store-db";

export async function GET(req: NextRequest) {
  try {
    const session = getCustomerSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ ok: false, authenticated: false }, { status: 401 });
    }

    let user = await getCustomerUserById(session.userId);
    if (!user) {
      user = await getCustomerUserByPhone(session.phone);
    }

    if (!user) {
      return NextResponse.json({ ok: false, authenticated: false }, { status: 401 });
    }

    const orders = await getCustomerOrders(user.id, user.phone);

    return NextResponse.json({
      ok: true,
      authenticated: true,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        addresses: user.addresses || [],
        defaultAddressId: user.defaultAddressId,
        hasPassword: Boolean(user.passwordHash),
      },
      orders,
    });
  } catch (err: any) {
    console.error("GET /api/auth/me error:", err);
    return NextResponse.json({ ok: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = getCustomerSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await getCustomerUserById(session.userId);
    if (!user) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    const body = await req.json();

    if (body.name && typeof body.name === "string") {
      const cleanName = body.name.trim();
      if (cleanName.length >= 2) user.name = cleanName;
    }

    if (body.email !== undefined) {
      user.email = body.email ? String(body.email).trim().toLowerCase() : undefined;
    }

    // Handle password change / set
    if (body.newPassword && typeof body.newPassword === "string") {
      if (body.newPassword.length < 6) {
        return NextResponse.json(
          { ok: false, error: "Password must be at least 6 characters." },
          { status: 400 }
        );
      }
      // If user had existing password, verify current password
      if (user.passwordHash && body.currentPassword) {
        const isMatch = await verifyPassword(body.currentPassword, user.passwordHash);
        if (!isMatch) {
          return NextResponse.json(
            { ok: false, error: "Current password is incorrect." },
            { status: 400 }
          );
        }
      }
      user.passwordHash = await hashPassword(body.newPassword);
    }

    // Handle phone number update (requires OTP verification)
    if (body.newPhone && body.phoneOtp) {
      const cleanNewPhone = normalizePhone(String(body.newPhone));
      if (cleanNewPhone.length === 10 && cleanNewPhone !== user.phone) {
        const isValid = await verifyCustomerOtp(cleanNewPhone, String(body.phoneOtp));
        if (!isValid) {
          return NextResponse.json(
            { ok: false, error: "Invalid OTP for the new phone number." },
            { status: 400 }
          );
        }
        // Verify no other account has this phone
        const conflict = await getCustomerUserByPhone(cleanNewPhone);
        if (conflict && conflict.id !== user.id) {
          return NextResponse.json(
            { ok: false, error: "This phone number is already registered to another account." },
            { status: 409 }
          );
        }
        user.phone = cleanNewPhone;
      }
    }

    await upsertCustomerUser(user);

    const res = NextResponse.json({
      ok: true,
      message: "Profile updated successfully.",
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        addresses: user.addresses || [],
        defaultAddressId: user.defaultAddressId,
        hasPassword: Boolean(user.passwordHash),
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
    console.error("PUT /api/auth/me error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to update profile." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true, message: "Logged out successfully." });
  clearCustomerSessionCookie(res);
  return res;
}
