import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST as startRevision } from "@/app/api/revisions/route";
import { decryptField, encrypt, isEncryptedField } from "@/lib/auth/encryption";

// vi.mock() calls below are hoisted above these imports by Vitest.

const { prisma, verifySession, getPageContent, generateQuestions } = vi.hoisted(() => ({
  prisma: {
    user: { findUnique: vi.fn() },
    revisionSession: { create: vi.fn(), update: vi.fn() },
    question: { findMany: vi.fn(), create: vi.fn(), updateMany: vi.fn() },
  },
  verifySession: vi.fn(),
  getPageContent: vi.fn(),
  generateQuestions: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ prisma }));
vi.mock("@/lib/auth/session", () => ({ verifySession }));
vi.mock("@/lib/adapters/notion", () => ({ getPageContent }));
vi.mock("@/lib/adapters/llm", () => ({ getQuestionGenerator: () => ({ generateQuestions }) }));

const request = (body: unknown) =>
  new Request("http://localhost/api/revisions", { method: "POST", body: JSON.stringify(body) });

beforeEach(() => {
  vi.resetAllMocks();
  verifySession.mockResolvedValue({ userId: "user-1", notionUserId: "notion-1" });
  prisma.user.findUnique.mockResolvedValue({ notionToken: encrypt("ntn_secret") });
  getPageContent.mockResolvedValue({ pageId: "page-1", title: "Géo", content: "Canberra…" });
  prisma.revisionSession.create.mockResolvedValue({ id: "session-1" });
  prisma.question.findMany.mockResolvedValue([]);
  prisma.question.create.mockImplementation(async ({ data }) => ({ id: "q", ...data }));
  generateQuestions.mockResolvedValue({
    questions: [{ question: "Capitale de l'Australie ?", answerExcerpt: "Canberra" }],
  });
});

describe("POST /api/revisions", () => {
  it("stores generated questions encrypted, never in plaintext", async () => {
    const res = await startRevision(request({ notionPageId: "page-1" }));

    expect(res.status).toBe(200);
    expect(getPageContent).toHaveBeenCalledWith("ntn_secret", "page-1");

    const { data } = prisma.question.create.mock.calls[0]![0];
    expect(isEncryptedField(data.questionText)).toBe(true);
    expect(isEncryptedField(data.answerExcerpt)).toBe(true);
    expect(JSON.stringify(data)).not.toContain("Australie");
    expect(decryptField(data.questionText)).toBe("Capitale de l'Australie ?");
    expect(decryptField(data.answerExcerpt)).toBe("Canberra");
  });

  it("returns 409 when Notion is disconnected, without touching Notion or the DB", async () => {
    prisma.user.findUnique.mockResolvedValue({ notionToken: null });

    const res = await startRevision(request({ notionPageId: "page-1" }));

    expect(res.status).toBe(409);
    expect((await res.json()).notionConnected).toBe(false);
    expect(getPageContent).not.toHaveBeenCalled();
    expect(prisma.revisionSession.create).not.toHaveBeenCalled();
  });

  it("returns 400 without notionPageId", async () => {
    expect((await startRevision(request({}))).status).toBe(400);
  });

  it("returns a 500 with a message when question generation fails", async () => {
    generateQuestions.mockRejectedValue(new Error("Missing credentials"));
    vi.spyOn(console, "error").mockImplementation(() => {});

    const res = await startRevision(request({ notionPageId: "page-1" }));

    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/session de révision/);
  });
});
