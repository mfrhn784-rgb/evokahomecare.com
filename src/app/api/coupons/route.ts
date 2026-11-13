import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin-auth";
import {
  deleteStoreCoupon,
  getEffectiveCoupons,
  getStoreCoupons,
  upsertStoreCoupon,
} from "@/lib/store-db";

export async function GET(req: NextRequest) {
  try {
    const customCoupons = await getStoreCoupons();
    const effective = await getEffectiveCoupons();
    return NextResponse.json({
      ok: true,
      coupons: customCoupons,
      effective,
    });
  } catch (err: any) {
    console.error("GET /api/coupons error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to fetch coupons." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const code = String(body.code || "").trim().toUpperCase();
    const discountPercent = Number(body.discountPercent);
    const minOrder = Number(body.minOrder ?? 0);
    const description = body.description ? String(body.description).trim() : undefined;
    const active = body.active !== false;

    if (!code || code.length < 2) {
      return NextResponse.json(
        { ok: false, error: "Coupon code must be at least 2 characters." },
        { status: 400 }
      );
    }

    if (!Number.isFinite(discountPercent) || discountPercent <= 0 || discountPercent > 100) {
      return NextResponse.json(
        { ok: false, error: "Discount percentage must be between 1% and 100%." },
        { status: 400 }
      );
    }

    const updatedCoupons = await upsertStoreCoupon({
      code,
      discountPercent,
      minOrder: isNaN(minOrder) ? 0 : minOrder,
      description,
      active,
    });

    const effective = await getEffectiveCoupons();

    return NextResponse.json({
      ok: true,
      message: `Promo coupon ${code} saved successfully.`,
      coupons: updatedCoupons,
      effective,
    });
  } catch (err: any) {
    console.error("POST /api/coupons error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to save promo coupon." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    if (!verifyAdminSession(req)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code")?.trim().toUpperCase();
    if (!code) {
      return NextResponse.json(
        { ok: false, error: "Coupon code is required." },
        { status: 400 }
      );
    }

    const updatedCoupons = await deleteStoreCoupon(code);
    const effective = await getEffectiveCoupons();

    return NextResponse.json({
      ok: true,
      message: `Coupon ${code} removed.`,
      coupons: updatedCoupons,
      effective,
    });
  } catch (err: any) {
    console.error("DELETE /api/coupons error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to delete coupon." },
      { status: 500 }
    );
  }
}
