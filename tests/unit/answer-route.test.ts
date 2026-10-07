import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST as answer } from "@/app/api/revisions/[sessionId]/answer/route";

// vi.mock() calls below are hoisted above these imports by Vitest.

const { prisma, verifySession } = vi.hoisted(() => {
  const prisma = {
    revisionSession: { findUnique: vi.fn(), update: vi.fn() },
    question: { findFirst: vi.fn(), update: vi.fn() },
    questionAttempt: { findFirst: vi.fn(), create: vi.fn() },
    userStreak: { findUnique: vi.fn(), upsert: vi.fn(), update: vi.fn() },
    $transaction: vi.fn(),
  };
  return { prisma, verifySession: vi.fn() };
});

vi.mock("@/lib/db", () => ({ prisma }));
vi.mock("@/lib/auth/session", () => ({ verifySession }));

const SESSION_ID = "11111111-1111-4111-8111-111111111111";
const QUESTION_ID = "22222222-2222-4222-8222-222222222222";

const call = (body: unknown, sessionId = SESSION_ID) =>
  answer(
    new Request(`http://localhost/api/revisions/${sessionId}/answer`, {
      method: "POST",
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
    { params: Promise.resolve({ sessionId }) }
  );

beforeEach(() => {
  vi.resetAllMocks();
  verifySession.mockResolvedValue({ userId: "user-1", notionUserId: "notion-1" });
  prisma.revisionSession.findUnique.mockResolvedValue({ id: SESSION_ID });
  prisma.question.findFirst.mockResolvedValue({ id: QUESTION_ID });
  prisma.questionAttempt.findFirst.mockResolvedValue(null);
  prisma.$transaction.mockImplementation(async (fn) => fn(prisma));
  prisma.revisionSession.update.mockResolvedValue({
    questionsAnswered: 1,
    questionsTotal: 5,
    correctCount: 1,
  });
});

describe("POST /api/revisions/:sessionId/answer", () => {
  it("records an answer for a question of the user's own session", async () => {
    const res = await call({ questionId: QUESTION_ID, isCorrect: true });

    expect(res.status).toBe(200);
    expect(prisma.question.findFirst).toHaveBeenCalledWith({
      where: { id: QUESTION_ID, sessionId: SESSION_ID, userId: "user-1" },
      select: { id: true },
    });
    expect(prisma.questionAttempt.create).toHaveBeenCalledWith({
      data: { questionId: QUESTION_ID, sessionId: SESSION_ID, isCorrect: true },
    });
    expect(await res.json()).toMatchObject({ questionsAnswered: 1, isComplete: false });
  });

  it("refuses a question that isn't in this session / owned by the user (regression)", async () => {
    prisma.question.findFirst.mockResolvedValue(null); // e.g. another user's question

    const res = await call({ questionId: QUESTION_ID, isCorrect: true });

    expect(res.status).toBe(404);
    expect(prisma.question.update).not.toHaveBeenCalled();
    expect(prisma.questionAttempt.create).not.toHaveBeenCalled();
  });

  it("refuses a second answer to the same question in the session", async () => {
    prisma.questionAttempt.findFirst.mockResolvedValue({ id: "attempt-1" });

    const res = await call({ questionId: QUESTION_ID, isCorrect: true });

    expect(res.status).toBe(409);
    expect(prisma.revisionSession.update).not.toHaveBeenCalled();
  });

  it("returns 404 for another user's session", async () => {
    prisma.revisionSession.findUnique.mockResolvedValue(null);
    expect((await call({ questionId: QUESTION_ID, isCorrect: false })).status).toBe(404);
  });

  it.each([
    ["missing isCorrect", { questionId: QUESTION_ID }],
    ["isCorrect as string", { questionId: QUESTION_ID, isCorrect: "true" }],
    ["questionId not a uuid", { questionId: "abc", isCorrect: true }],
    ["malformed JSON", "{not json"],
  ])("returns 400 for %s, before touching the database", async (_label, body) => {
    const res = await call(body);
    expect(res.status).toBe(400);
    expect(prisma.revisionSession.findUnique).not.toHaveBeenCalled();
  });

  it("returns 400 for a session id that isn't a uuid (was a Prisma 500)", async () => {
    expect((await call({ questionId: QUESTION_ID, isCorrect: true }, "not-a-uuid")).status).toBe(
      400
    );
  });
});
