import { SignJWT } from "jose";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { createSession, revokeAllSessions, verifySession } from "@/lib/auth/session";

// vi.mock() calls below are hoisted above these imports by Vitest.

const { prisma, cookieJar } = vi.hoisted(() => ({
  prisma: { user: { findUnique: vi.fn(), update: vi.fn() } },
  cookieJar: new Map<string, string>(),
}));

vi.mock("@/lib/db", () => ({ prisma }));
vi.mock("next/headers", () => ({
  cookies: () => ({
    get: (name: string) => (cookieJar.has(name) ? { value: cookieJar.get(name) } : undefined),
    set: (name: string, value: string) => cookieJar.set(name, value),
    delete: (name: string) => cookieJar.delete(name),
  }),
}));

const COOKIE = "notiontutor_session";

beforeEach(() => {
  vi.resetAllMocks();
  cookieJar.clear();
});

async function login(sessionVersion: number) {
  await createSession({ userId: "user-1", notionUserId: "notion-1", sessionVersion });
}

describe("verifySession", () => {
  it("accepts a session whose version matches the database", async () => {
    await login(2);
    prisma.user.findUnique.mockResolvedValue({ sessionVersion: 2, deletedAt: null });

    expect(await verifySession()).toEqual({ userId: "user-1", notionUserId: "notion-1" });
  });

  it("rejects a session revoked by a version bump (regression: JWTs couldn't be revoked)", async () => {
    await login(2);
    prisma.user.findUnique.mockResolvedValue({ sessionVersion: 3, deletedAt: null });

    expect(await verifySession()).toBeNull();
  });

  it("rejects sessions of deleted or soft-deleted users", async () => {
    await login(0);
    prisma.user.findUnique.mockResolvedValue(null);
    expect(await verifySession()).toBeNull();

    prisma.user.findUnique.mockResolvedValue({ sessionVersion: 0, deletedAt: new Date() });
    expect(await verifySession()).toBeNull();
  });

  it("keeps sessions issued before versioning valid (no sv claim = version 0)", async () => {
    const legacy = await new SignJWT({ userId: "user-1", notionUserId: "notion-1" })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime("1h")
      .sign(new TextEncoder().encode(process.env.SESSION_SECRET));
    cookieJar.set(COOKIE, legacy);
    prisma.user.findUnique.mockResolvedValue({ sessionVersion: 0, deletedAt: null });

    expect(await verifySession()).not.toBeNull();
  });

  it("rejects forged or missing cookies without querying the database", async () => {
    expect(await verifySession()).toBeNull();
    cookieJar.set(COOKIE, "forged.jwt.value");
    expect(await verifySession()).toBeNull();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });
});

describe("revokeAllSessions", () => {
  it("bumps the user's session version", async () => {
    await revokeAllSessions("user-1");
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { sessionVersion: { increment: 1 } },
    });
  });
});
