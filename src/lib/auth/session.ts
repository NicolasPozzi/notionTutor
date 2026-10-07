import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

import { prisma } from "@/lib/db";

const COOKIE_NAME = "notiontutor_session";
const MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

interface SessionPayload {
  userId: string;
  notionUserId: string;
}

interface CreateSessionInput extends SessionPayload {
  /** users.sessionVersion at login; bumping it in the DB revokes the session. */
  sessionVersion: number;
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
export async function createSession(payload: CreateSessionInput): Promise<void> {
  const token = await new SignJWT({
    userId: payload.userId,
    notionUserId: payload.notionUserId,
    sv: payload.sessionVersion,
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
 * Verify the session from cookies: valid signature and expiry, AND the user
 * still exists with the same sessionVersion. A JWT alone can't be revoked, so
 * a stolen cookie stayed valid for 30 days even after logout.
 * Returns the payload or null if invalid, expired or revoked.
 */
export async function verifySession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;

  let payload: Record<string, unknown>;
  try {
    ({ payload } = await jwtVerify(token, getSecret()));
  } catch {
    return null;
  }

  const userId = payload.userId as string;
  // Sessions issued before revocation existed carry no version: treat as 0.
  const sessionVersion = typeof payload.sv === "number" ? payload.sv : 0;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { sessionVersion: true, deletedAt: true },
  });
  if (!user || user.deletedAt || user.sessionVersion !== sessionVersion) return null;

  return { userId, notionUserId: payload.notionUserId as string };
}

/**
 * Clear the session cookie on this device.
 */
export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

/**
 * Revoke every session of a user (all devices), e.g. on logout.
 */
export async function revokeAllSessions(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { sessionVersion: { increment: 1 } },
  });
}
