import { NextResponse } from "next/server";

import { decryptField } from "@/lib/auth/encryption";
import { verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { parse, uuid } from "@/lib/validation";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsedId = parse(uuid, (await params).sessionId);
  if (!parsedId.ok) return parsedId.response;
  const sessionId = parsedId.data;

  const revisionSession = await prisma.revisionSession.findUnique({
    where: { id: sessionId, userId: session.userId },
    select: {
      id: true,
      notionPageId: true,
      notionPageTitle: true,
      status: true,
      questionsTotal: true,
      questionsAnswered: true,
      correctCount: true,
      startedAt: true,
      completedAt: true,
    },
  });

  if (!revisionSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  const attempts = await prisma.questionAttempt.findMany({
    where: { sessionId },
    orderBy: { attemptedAt: "asc" },
    select: {
      id: true,
      isCorrect: true,
      attemptedAt: true,
      question: {
        select: {
          id: true,
          questionText: true,
          answerExcerpt: true,
          timesAsked: true,
          timesCorrect: true,
        },
      },
    },
  });

  const decryptedAttempts = attempts.map((a) => ({
    ...a,
    question: {
      ...a.question,
      questionText: decryptField(a.question.questionText),
      answerExcerpt: decryptField(a.question.answerExcerpt),
    },
  }));

  return NextResponse.json({ session: revisionSession, attempts: decryptedAttempts });
}
