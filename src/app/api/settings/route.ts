import { NextRequest, NextResponse } from "next/server";
import { getStoreSettings, updateStoreSettings } from "@/lib/store-db";
import { verifyAdminSession } from "@/lib/admin-auth";

export async function GET() {
  try {
    const settings = await getStoreSettings();
    return NextResponse.json({ ok: true, settings });
  } catch (err) {
    console.error("GET /api/settings error:", err);
    return NextResponse.json({ ok: false, error: "Failed to fetch settings." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized. Admin PIN required." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const deliveryCharge = Number(body.deliveryCharge);
    if (isNaN(deliveryCharge) || deliveryCharge < 0) {
      return NextResponse.json({ ok: false, error: "Valid delivery charge required." }, { status: 400 });
    }

    const updated = await updateStoreSettings({ deliveryCharge });
    return NextResponse.json({ ok: true, settings: updated, message: "Settings saved successfully." });
  } catch (err) {
    console.error("POST /api/settings error:", err);
    return NextResponse.json({ ok: false, error: "Failed to update settings." }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}
