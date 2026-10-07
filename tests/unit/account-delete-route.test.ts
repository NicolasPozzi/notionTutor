import { beforeEach, describe, expect, it, vi } from "vitest";

import { DELETE as deleteAccount } from "@/app/api/account/delete/route";
import { encrypt } from "@/lib/auth/encryption";

// vi.mock() calls below are hoisted above these imports by Vitest.

const { prisma, verifySession, clearSession } = vi.hoisted(() => ({
  prisma: { user: { findUnique: vi.fn(), delete: vi.fn() } },
  verifySession: vi.fn(),
  clearSession: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ prisma }));
vi.mock("@/lib/auth/session", () => ({ verifySession, clearSession }));

beforeEach(() => {
  vi.resetAllMocks();
  verifySession.mockResolvedValue({ userId: "user-1", notionUserId: "notion-1" });
});

describe("DELETE /api/account/delete", () => {
  it("revokes the Notion token at Notion, then deletes everything (regression)", async () => {
    prisma.user.findUnique.mockResolvedValue({ notionToken: encrypt("ntn_secret") });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}"));

    const res = await deleteAccount();

    expect(res.status).toBe(200);
    expect(String(fetchMock.mock.calls[0]![0])).toBe("https://api.notion.com/v1/oauth/revoke");
    expect(JSON.parse(fetchMock.mock.calls[0]![1]!.body as string)).toEqual({
      token: "ntn_secret",
    });
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: "user-1" } });
    expect(clearSession).toHaveBeenCalled();
  });

  it("still deletes the account when Notion revocation fails", async () => {
    prisma.user.findUnique.mockResolvedValue({ notionToken: encrypt("ntn_secret") });
    vi.spyOn(globalThis, "fetch").mockRejectedValue(new TypeError("fetch failed"));
    vi.spyOn(console, "warn").mockImplementation(() => {});

    expect((await deleteAccount()).status).toBe(200);
    expect(prisma.user.delete).toHaveBeenCalled();
  });

  it("skips revocation when Notion is already disconnected", async () => {
    prisma.user.findUnique.mockResolvedValue({ notionToken: null });
    const fetchMock = vi.spyOn(globalThis, "fetch");

    await deleteAccount();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(prisma.user.delete).toHaveBeenCalled();
  });

  it("returns 401 without a session and deletes nothing", async () => {
    verifySession.mockResolvedValue(null);
    expect((await deleteAccount()).status).toBe(401);
    expect(prisma.user.delete).not.toHaveBeenCalled();
  });
});
