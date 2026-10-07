import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST as createDigest } from "@/app/api/digests/route";
import { MAX_ACTIVE_DIGESTS } from "@/lib/limits";

// vi.mock() calls below are hoisted above these imports by Vitest.

const { prisma, verifySession } = vi.hoisted(() => ({
  prisma: { digest: { findFirst: vi.fn(), count: vi.fn(), create: vi.fn() } },
  verifySession: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ prisma }));
vi.mock("@/lib/auth/session", () => ({ verifySession }));

const request = (body: unknown) =>
  new Request("http://localhost/api/digests", { method: "POST", body: JSON.stringify(body) });

beforeEach(() => {
  vi.resetAllMocks();
  verifySession.mockResolvedValue({ userId: "user-1", notionUserId: "notion-1" });
  prisma.digest.findFirst.mockResolvedValue(null);
  prisma.digest.count.mockResolvedValue(0);
  prisma.digest.create.mockImplementation(async ({ data }) => ({ id: "d1", ...data }));
});

describe("POST /api/digests", () => {
  it("creates a digest with an unguessable unsubscribe token", async () => {
    const res = await createDigest(request({ notionPageId: "page-1", notionPageTitle: "Géo" }));

    expect(res.status).toBe(201);
    const { data } = prisma.digest.create.mock.calls[0]![0];
    expect(data).toMatchObject({ userId: "user-1", notionPageId: "page-1", frequency: "daily" });
    expect(data.unsubscribeToken).toMatch(/^[0-9a-f]{64}$/);
  });

  it("caps the number of active digests per user", async () => {
    prisma.digest.count.mockResolvedValue(MAX_ACTIVE_DIGESTS);

    const res = await createDigest(request({ notionPageId: "page-11" }));

    expect(res.status).toBe(429);
    expect((await res.json()).error).toMatch(/Limite atteinte/);
    expect(prisma.digest.create).not.toHaveBeenCalled();
    expect(prisma.digest.count.mock.calls[0]![0].where).toEqual({
      userId: "user-1",
      status: { not: "completed" },
    });
  });

  it("refuses a second active digest for the same page", async () => {
    prisma.digest.findFirst.mockResolvedValue({ id: "existing" });
    expect((await createDigest(request({ notionPageId: "page-1" }))).status).toBe(409);
  });

  it("returns 401 without a session", async () => {
    verifySession.mockResolvedValue(null);
    expect((await createDigest(request({ notionPageId: "page-1" }))).status).toBe(401);
  });
});
