import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as exportAccount } from "@/app/api/account/export/route";
import { encryptField } from "@/lib/auth/encryption";

// vi.mock() calls below are hoisted above these imports by Vitest.

const { prisma, verifySession } = vi.hoisted(() => ({
  prisma: {
    user: { findUnique: vi.fn() },
    revisionSession: { findMany: vi.fn() },
    questionAttempt: { findMany: vi.fn() },
    question: { findMany: vi.fn() },
    digest: { findMany: vi.fn() },
    userStreak: { findUnique: vi.fn() },
  },
  verifySession: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ prisma }));
vi.mock("@/lib/auth/session", () => ({ verifySession }));

beforeEach(() => {
  vi.resetAllMocks();
  verifySession.mockResolvedValue({ userId: "user-1", notionUserId: "notion-1" });
  prisma.user.findUnique.mockResolvedValue({ email: "me@example.com", name: "Nico" });
  prisma.revisionSession.findMany.mockResolvedValue([]);
  prisma.questionAttempt.findMany.mockResolvedValue([]);
  prisma.question.findMany.mockResolvedValue([
    {
      notionPageId: "p1",
      questionText: encryptField("Capitale de l'Australie ?"),
      answerExcerpt: encryptField("Canberra"),
      timesAsked: 0,
      timesCorrect: 0,
    },
  ]);
  prisma.digest.findMany.mockResolvedValue([{ notionPageId: "p1", frequency: "weekly" }]);
  prisma.userStreak.findUnique.mockResolvedValue({ currentStreak: 3, longestStreak: 5 });
});

describe("GET /api/account/export (RGPD)", () => {
  it("includes questions (decrypted, even unanswered), digests and streak (regression)", async () => {
    const res = await exportAccount();
    const data = JSON.parse(await res.text());

    expect(res.headers.get("content-disposition")).toMatch(
      /attachment; filename="notiontutor-export-/
    );
    expect(data.account.email).toBe("me@example.com");
    expect(data.questions).toEqual([
      expect.objectContaining({
        questionText: "Capitale de l'Australie ?",
        answerExcerpt: "Canberra",
        timesAsked: 0,
      }),
    ]);
    expect(data.digests).toEqual([{ notionPageId: "p1", frequency: "weekly" }]);
    expect(data.streak).toEqual({ currentStreak: 3, longestStreak: 5 });
    expect(JSON.stringify(data)).not.toContain("enc:v1:");
  });

  it("only queries the requesting user's data", async () => {
    await exportAccount();
    for (const model of ["question", "digest", "revisionSession"] as const) {
      expect(prisma[model].findMany.mock.calls[0]![0].where).toEqual({ userId: "user-1" });
    }
    expect(prisma.questionAttempt.findMany.mock.calls[0]![0].where).toEqual({
      question: { userId: "user-1" },
    });
  });

  it("returns 401 without a session", async () => {
    verifySession.mockResolvedValue(null);
    expect((await exportAccount()).status).toBe(401);
  });
});
