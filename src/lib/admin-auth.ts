import crypto from "crypto";
import { NextRequest } from "next/server";

export const ADMIN_COOKIE_NAME = "evoka_admin_session";

function getSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || (process.env.ADMIN_PIN || "evoka2026") + "_secret_salt";
}

export function createAdminToken(): string {
  const payload = `admin:${Date.now()}`;
  const sig = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

export function verifyAdminSession(req: NextRequest): boolean {
  const expectedPin = process.env.ADMIN_PIN || "evoka2026";
  const headerPin = req.headers.get("x-admin-pin");
  if (headerPin && headerPin === expectedPin) return true;

  const token = req.cookies.get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return false;
  const lastDot = token.lastIndexOf(".");
  if (lastDot < 0) return false;
  const payload = token.slice(0, lastDot);
  const sig = token.slice(lastDot + 1);
  const expectedSig = crypto.createHmac("sha256", getSecret()).update(payload).digest("hex");
  if (sig.length !== expectedSig.length) return false;
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig));
}

const attempts = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(key: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + 60_000 });
    return { allowed: true, retryAfterSec: 0 };
  }
  entry.count += 1;
  if (entry.count > 6) {
    return { allowed: false, retryAfterSec: Math.ceil((entry.resetAt - now) / 1000) };
  }
  return { allowed: true, retryAfterSec: 0 };
}
