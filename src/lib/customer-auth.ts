import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { AuthSession } from "./types";

export const CUSTOMER_COOKIE_NAME = "evoka_customer_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 days

function getSecret(): string {
  return (
    process.env.CUSTOMER_SESSION_SECRET ||
    process.env.ADMIN_SESSION_SECRET ||
    "evoka_customer_auth_fallback_secret_key_2026"
  );
}

/**
 * Creates a signed JWT-like token (header.payload.signature) using HMAC-SHA256
 */
export function signCustomerSession(session: AuthSession): string {
  const payloadStr = Buffer.from(
    JSON.stringify({ ...session, iat: Math.floor(Date.now() / 1000) })
  ).toString("base64url");
  const sig = crypto.createHmac("sha256", getSecret()).update(payloadStr).digest("base64url");
  return `${payloadStr}.${sig}`;
}

export function verifyCustomerSessionToken(token: string | undefined | null): AuthSession | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadStr, sig] = parts;
  const expectedSig = crypto.createHmac("sha256", getSecret()).update(payloadStr).digest("base64url");
  if (sig.length !== expectedSig.length) return null;
  const match = crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig));
  if (!match) return null;

  try {
    const raw = Buffer.from(payloadStr, "base64url").toString("utf-8");
    const parsed = JSON.parse(raw);
    if (!parsed.userId || !parsed.phone) return null;
    return {
      userId: parsed.userId,
      phone: parsed.phone,
      name: parsed.name || "",
      email: parsed.email || undefined,
    };
  } catch {
    return null;
  }
}

export function getCustomerSessionFromRequest(req: NextRequest): AuthSession | null {
  const cookieVal = req.cookies.get(CUSTOMER_COOKIE_NAME)?.value;
  return verifyCustomerSessionToken(cookieVal);
}

export function setCustomerSessionCookie(res: NextResponse, session: AuthSession): void {
  const token = signCustomerSession(session);
  res.cookies.set({
    name: CUSTOMER_COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export function clearCustomerSessionCookie(res: NextResponse): void {
  res.cookies.set({
    name: CUSTOMER_COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/**
 * Password Hashing with scrypt + salt
 */
export async function hashPassword(plainText: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString("hex");
  return new Promise((resolve, reject) => {
    crypto.scrypt(plainText, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(`${salt}:${derivedKey.toString("hex")}`);
    });
  });
}

export async function verifyPassword(plainText: string, storedHash: string): Promise<boolean> {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;
  return new Promise((resolve) => {
    crypto.scrypt(plainText, salt, 64, (err, derivedKey) => {
      if (err) return resolve(false);
      const keyBuffer = Buffer.from(key, "hex");
      if (keyBuffer.length !== derivedKey.length) return resolve(false);
      resolve(crypto.timingSafeEqual(keyBuffer, derivedKey));
    });
  });
}

/**
 * Generate a 6-digit numeric OTP
 */
export function generateNumericOtp(length = 6): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return Math.floor(min + Math.random() * (max - min + 1)).toString();
}

/**
 * Normalize Indian phone numbers to 10 digits
 */
export function normalizePhone(raw: string): string {
  const digits = String(raw || "").replace(/\D/g, "");
  return digits.slice(-10);
}

export const normalizePhone10 = normalizePhone;
