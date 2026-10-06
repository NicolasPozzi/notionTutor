import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as getMe } from "@/app/api/auth/me/route";
import { POST as disconnect } from "@/app/api/auth/notion/disconnect/route";
import { GET as getPages } from "@/app/api/pages/route";
import { encrypt } from "@/lib/auth/encryption";

// vi.mock() calls below are hoisted above these imports by Vitest.

const { prisma, verifySession, searchPages } = vi.hoisted(() => ({
  prisma: { user: { findUnique: vi.fn(), update: vi.fn() } },
  verifySession: vi.fn(),
  searchPages: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ prisma }));
vi.mock("@/lib/auth/session", () => ({ verifySession }));
vi.mock("@/lib/adapters/notion", () => ({ searchPages, getPageContent: vi.fn() }));

const SESSION = { userId: "user-1", notionUserId: "notion-1" };

beforeEach(() => {
  vi.resetAllMocks();
  verifySession.mockResolvedValue(SESSION);
});

describe("GET /api/auth/me", () => {
  it("exposes connection state and workspace name, never the token", async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      email: "a@b.c",
      notionToken: encrypt("ntn_secret"),
      notionWorkspaceName: "Espace perso",
    });

    const body = await (await getMe()).json();

    expect(body.user.notionConnected).toBe(true);
    expect(body.user.notionWorkspaceName).toBe("Espace perso");
    expect(body.user).not.toHaveProperty("notionToken");
    expect(JSON.stringify(body)).not.toContain("ntn_secret");
  });

  it("reports a disconnected account", async () => {
    prisma.user.findUnique.mockResolvedValue({ id: "user-1", notionToken: null });
    const body = await (await getMe()).json();
    expect(body.user.notionConnected).toBe(false);
  });

  it("returns 401 without a session", async () => {
    verifySession.mockResolvedValue(null);
    expect((await getMe()).status).toBe(401);
  });
});

describe("POST /api/auth/notion/disconnect (Story 2.5)", () => {
  it("revokes at Notion then clears token and workspace, keeping the account", async () => {
    prisma.user.findUnique.mockResolvedValue({ notionToken: encrypt("ntn_secret") });
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("{}"));

    const res = await disconnect();

    expect(res.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0]!;
    expect(JSON.parse(init!.body as string)).toEqual({ token: "ntn_secret" });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { notionToken: null, notionWorkspaceId: null, notionWorkspaceName: null },
    });
  });

  it("still disconnects locally when Notion revocation fails", async () => {
    prisma.user.findUnique.mockResolvedValue({ notionToken: encrypt("ntn_secret") });
    vi.spyOn(globalThis, "fetch").mockResolvedValue(new Response("nope", { status: 400 }));
    vi.spyOn(console, "warn").mockImplementation(() => {});

    expect((await disconnect()).status).toBe(200);
    expect(prisma.user.update).toHaveBeenCalledOnce();
  });

  it("is idempotent for an already disconnected account", async () => {
    prisma.user.findUnique.mockResolvedValue({ notionToken: null });
    const fetchMock = vi.spyOn(globalThis, "fetch");

    expect((await disconnect()).status).toBe(200);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns 401 without a session", async () => {
    verifySession.mockResolvedValue(null);
    expect((await disconnect()).status).toBe(401);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});

describe("GET /api/pages", () => {
  it("returns an empty disconnected result without calling Notion", async () => {
    prisma.user.findUnique.mockResolvedValue({ notionToken: null });

    const res = await getPages(new Request("http://localhost/api/pages"));

    expect(await res.json()).toEqual({
      pages: [],
      hasMore: false,
      nextCursor: null,
      notionConnected: false,
    });
    expect(searchPages).not.toHaveBeenCalled();
  });

  it("lists pages with the decrypted token when connected", async () => {
    prisma.user.findUnique.mockResolvedValue({ notionToken: encrypt("ntn_secret") });
    searchPages.mockResolvedValue({ pages: [{ id: "p1" }], hasMore: false, nextCursor: null });

    const body = await (await getPages(new Request("http://localhost/api/pages"))).json();

    expect(searchPages).toHaveBeenCalledWith("ntn_secret", null);
    expect(body.notionConnected).toBe(true);
    expect(body.pages).toEqual([{ id: "p1" }]);
  });
});
