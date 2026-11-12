import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession, createAdminToken, checkRateLimit, ADMIN_COOKIE_NAME } from "@/lib/admin-auth";

export async function GET(req: NextRequest) {
  return NextResponse.json({ authenticated: verifyAdminSession(req) });
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") || "local";
  const rate = checkRateLimit(ip);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Too many failed attempts. Please wait ${rate.retryAfterSec} seconds.` },
      { status: 429 }
    );
  }

  const { pin } = (await req.json()) as { pin?: string };
  const expectedPin = process.env.ADMIN_PIN || "evoka2026";
  if (!pin || pin !== expectedPin) {
    return NextResponse.json({ error: "Incorrect Admin PIN." }, { status: 401 });
  }

  const token = createAdminToken();
  const res = NextResponse.json({ authenticated: true });
  res.cookies.set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12, // 12 hours
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ authenticated: false });
  res.cookies.delete(ADMIN_COOKIE_NAME);
  return res;
}
