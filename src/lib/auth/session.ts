import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "notiontutor_session";
const MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

interface SessionPayload {
  userId: string;
  notionUserId: string;
}

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is required");
  }
  return new TextEncoder().encode(secret);
}

/**
 * Create a JWT session and set it as an HttpOnly cookie.
 */
export async function createSession(payload: SessionPayload): Promise<void> {
  const token = await new SignJWT({
    userId: payload.userId,
    notionUserId: payload.notionUserId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

/**
 * Verify the session JWT from cookies.
 * Returns the payload or null if invalid/expired.
 */
export async function verifySession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      userId: payload.userId as string,
      notionUserId: payload.notionUserId as string,
    };
  } catch {
    return null;
  }
}

/**
 * Clear the session cookie (logout).
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
