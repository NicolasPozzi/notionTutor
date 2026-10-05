import { NextResponse } from "next/server";

import { decryptField } from "@/lib/auth/encryption";
import { verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;

  const revisionSession = await prisma.revisionSession.findUnique({
    where: { id: sessionId, userId: session.userId },
    include: {
      questions: {
        orderBy: { createdAt: "asc" },
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

  if (!revisionSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Check which questions were previously missed (from other sessions)
  const questionIds = revisionSession.questions.map((q) => q.id);
  const previousAttempts = await prisma.questionAttempt.findMany({
    where: {
      questionId: { in: questionIds },
      sessionId: { not: sessionId },
      isCorrect: false,
    },
    select: { questionId: true },
  });
  const previouslyMissedIds = new Set(previousAttempts.map((a) => a.questionId));

  const questions = revisionSession.questions.map((q) => ({
    ...q,
    questionText: decryptField(q.questionText),
    answerExcerpt: decryptField(q.answerExcerpt),
    previouslyMissed: previouslyMissedIds.has(q.id),
  }));

  return NextResponse.json({
    id: revisionSession.id,
    notionPageId: revisionSession.notionPageId,
    pageTitle: revisionSession.notionPageTitle,
    status: revisionSession.status,
    questionsTotal: revisionSession.questionsTotal,
    questionsAnswered: revisionSession.questionsAnswered,
    correctCount: revisionSession.correctCount,
    questions,
  });
}
