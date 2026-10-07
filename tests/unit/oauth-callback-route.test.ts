import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as callback } from "@/app/api/auth/notion/callback/route";
import { decrypt } from "@/lib/auth/encryption";

// vi.mock() calls below are hoisted above these imports by Vitest.

const { prisma, createSession, cookieJar } = vi.hoisted(() => ({
  prisma: { user: { upsert: vi.fn() } },
  createSession: vi.fn(),
  cookieJar: new Map<string, string>(),
}));

vi.mock("@/lib/db", () => ({ prisma }));
vi.mock("@/lib/auth/session", () => ({ createSession }));
vi.mock("next/headers", () => ({
  cookies: () => ({
    get: (name: string) => (cookieJar.has(name) ? { value: cookieJar.get(name) } : undefined),
    delete: (name: string) => cookieJar.delete(name),
  }),
}));

const callbackUrl = (state = "state-123") =>
  new Request(`https://app.test/api/auth/notion/callback?code=abc&state=${state}`);

function mockNotion({ ownerEmail, usersMeEmail }: { ownerEmail?: string; usersMeEmail?: string }) {
  return vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
    const url = String(input);
    if (url.endsWith("/oauth/token")) {
      return Response.json({
        access_token: "ntn_access",
        workspace_id: "ws-1",
        workspace_name: "Espace perso",
        bot_id: "bot-1",
        owner: {
          type: "user",
          user: {
            id: "notion-user-1",
            name: "Nicolas",
            person: ownerEmail ? { email: ownerEmail } : {},
          },
        },
      });
    }
    // /v1/users/me describes the bot; its owner often lacks the email.
    return Response.json({
      bot: {
        owner: {
          user: {
            id: "notion-user-1",
            name: "Nicolas",
            person: usersMeEmail ? { email: usersMeEmail } : null,
          },
        },
      },
    });
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  cookieJar.clear();
  cookieJar.set("notion_oauth_state", "state-123");
  cookieJar.set("notion_oauth_verifier", "verifier");
  prisma.user.upsert.mockResolvedValue({
    id: "user-1",
    notionUserId: "notion-user-1",
    sessionVersion: 3,
  });
});

describe("GET /api/auth/notion/callback", () => {
  it("stores the email from the OAuth owner when /users/me has none (regression)", async () => {
    mockNotion({ ownerEmail: "me@example.com" });

    const res = await callback(callbackUrl());

    expect(res.headers.get("location")).toBe("https://app.test/dashboard");
    const { create, update, where } = prisma.user.upsert.mock.calls[0]![0];
    expect(where).toEqual({ notionUserId: "notion-user-1" });
    expect(create.email).toBe("me@example.com");
    expect(update.email).toBe("me@example.com");
    expect(decrypt(create.notionToken)).toBe("ntn_access");
    expect(createSession).toHaveBeenCalledWith({
      userId: "user-1",
      notionUserId: "notion-user-1",
      sessionVersion: 3,
    });
  });

  it("falls back to /users/me email", async () => {
    mockNotion({ usersMeEmail: "fallback@example.com" });

    await callback(callbackUrl());

    expect(prisma.user.upsert.mock.calls[0]![0].create.email).toBe("fallback@example.com");
  });

  it("does not wipe a stored email when Notion returns none", async () => {
    mockNotion({});

    await callback(callbackUrl());

    const { create, update } = prisma.user.upsert.mock.calls[0]![0];
    expect(create.email).toBeNull();
    expect(update.email).toBeUndefined(); // Prisma leaves the column unchanged
  });

  it("rejects a state that doesn't match the cookie (CSRF)", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch");

    const res = await callback(callbackUrl("forged"));

    expect(res.headers.get("location")).toBe("https://app.test/?error=invalid_state");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(prisma.user.upsert).not.toHaveBeenCalled();
  });
});
