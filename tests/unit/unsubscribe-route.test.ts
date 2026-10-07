import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET, POST } from "@/app/api/digests/unsubscribe/[token]/route";

// vi.mock() calls below are hoisted above these imports by Vitest.

const { prisma } = vi.hoisted(() => ({
  prisma: { digest: { findUnique: vi.fn(), update: vi.fn() } },
}));

vi.mock("@/lib/db", () => ({ prisma }));

const TOKEN = "a".repeat(64);
const ctx = (token = TOKEN) => ({ params: Promise.resolve({ token }) });
const req = (method: string, token = TOKEN) =>
  new Request(`http://localhost/api/digests/unsubscribe/${token}`, { method });

beforeEach(() => {
  vi.resetAllMocks();
  prisma.digest.findUnique.mockResolvedValue({ id: "d1", notionPageTitle: "Mes <notes>" });
});

describe("digest unsubscribe", () => {
  it("GET only shows a confirmation form and changes nothing (regression)", async () => {
    const res = await GET(req("GET"), ctx());
    const html = await res.text();

    expect(res.status).toBe(200);
    expect(html).toContain('<form method="POST">');
    expect(html).toContain("Mes &lt;notes&gt;"); // page title is escaped
    expect(prisma.digest.update).not.toHaveBeenCalled();
  });

  it("POST pauses the digest (also used by RFC 8058 one-click)", async () => {
    const res = await POST(req("POST"), ctx());

    expect(res.status).toBe(200);
    expect(await res.text()).toContain("Désabonné");
    expect(prisma.digest.update).toHaveBeenCalledWith({
      where: { id: "d1" },
      data: { status: "paused" },
    });
  });

  it.each(["not-a-real-token", "a".repeat(63), "../x"])(
    "rejects malformed token %s without querying the database",
    async (token) => {
      const res = await POST(req("POST", token), ctx(token));
      expect(res.status).toBe(404);
      expect(prisma.digest.findUnique).not.toHaveBeenCalled();
      expect(prisma.digest.update).not.toHaveBeenCalled();
    }
  );

  it("returns 404 for an unknown token", async () => {
    prisma.digest.findUnique.mockResolvedValue(null);
    expect((await GET(req("GET"), ctx())).status).toBe(404);
    expect((await POST(req("POST"), ctx())).status).toBe(404);
  });
});
