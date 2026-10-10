import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { env } from "@/lib/env";

const COOKIE_NAME = "mcp_session";
const MAX_AGE = 60 * 60 * 24 * 7;

function secretKey() {
  return new TextEncoder().encode(env.authSecret());
}

export async function createSessionToken(): Promise<string> {
  return new SignJWT({ role: "mcp_admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, secretKey());
    return true;
  } catch {
    return false;
  }
}

export async function setSessionCookie(token: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verifySessionToken(token);
}

export { COOKIE_NAME };
