import { NextRequest, NextResponse } from "next/server";
import { getCustomerSessionFromRequest } from "@/lib/customer-auth";
import {
  addCustomerAddress,
  deleteCustomerAddress,
  getCustomerUserById,
  setDefaultCustomerAddress,
  updateCustomerAddress,
} from "@/lib/store-db";

export async function POST(req: NextRequest) {
  try {
    const session = getCustomerSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const line1 = String(body.line1 || "").trim();
    const city = String(body.city || "").trim();
    const state = String(body.state || "Kerala").trim();
    const pincode = String(body.pincode || "").trim();
    const label = body.label === "Work" ? "Work" : body.label === "Other" ? "Other" : "Home";
    const landmark = body.landmark ? String(body.landmark).trim() : undefined;
    const isDefault = Boolean(body.isDefault);

    if (!line1 || line1.length < 5) {
      return NextResponse.json(
        { ok: false, error: "Please provide a complete street address / building name." },
        { status: 400 }
      );
    }

    if (!city) {
      return NextResponse.json(
        { ok: false, error: "City / District is required." },
        { status: 400 }
      );
    }

    if (!pincode || pincode.length < 6) {
      return NextResponse.json(
        { ok: false, error: "Please provide a valid 6-digit postal PIN code." },
        { status: 400 }
      );
    }

    const created = await addCustomerAddress(session.userId, {
      label,
      line1,
      landmark,
      city,
      state,
      pincode,
      isDefault,
    });

    if (!created) {
      return NextResponse.json({ ok: false, error: "Failed to save address." }, { status: 400 });
    }

    const user = await getCustomerUserById(session.userId);
    return NextResponse.json({
      ok: true,
      message: "Address saved successfully.",
      address: created,
      addresses: user?.addresses || [],
    });
  } catch (err: any) {
    console.error("POST /api/auth/addresses error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to add address." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = getCustomerSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const addressId = String(body.id || "");
    if (!addressId) {
      return NextResponse.json({ ok: false, error: "Address ID is required." }, { status: 400 });
    }

    // Check if simply setting default
    if (body.action === "set_default") {
      const ok = await setDefaultCustomerAddress(session.userId, addressId);
      const user = await getCustomerUserById(session.userId);
      return NextResponse.json({
        ok,
        message: "Default address updated.",
        addresses: user?.addresses || [],
      });
    }

    // Full address update
    const updated = await updateCustomerAddress(session.userId, {
      id: addressId,
      label: body.label || "Home",
      line1: String(body.line1 || "").trim(),
      landmark: body.landmark ? String(body.landmark).trim() : undefined,
      city: String(body.city || "").trim(),
      state: String(body.state || "Kerala").trim(),
      pincode: String(body.pincode || "").trim(),
      isDefault: Boolean(body.isDefault),
    });

    const user = await getCustomerUserById(session.userId);
    return NextResponse.json({
      ok: Boolean(updated),
      message: "Address updated successfully.",
      address: updated,
      addresses: user?.addresses || [],
    });
  } catch (err: any) {
    console.error("PUT /api/auth/addresses error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to update address." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = getCustomerSessionFromRequest(req);
    if (!session) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const addressId = searchParams.get("id");
    if (!addressId) {
      return NextResponse.json({ ok: false, error: "Address ID is required." }, { status: 400 });
    }

    const ok = await deleteCustomerAddress(session.userId, addressId);
    const user = await getCustomerUserById(session.userId);
    return NextResponse.json({
      ok,
      message: "Address removed.",
      addresses: user?.addresses || [],
    });
  } catch (err: any) {
    console.error("DELETE /api/auth/addresses error:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to delete address." },
      { status: 500 }
    );
  }
}
