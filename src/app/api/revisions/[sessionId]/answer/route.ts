import { NextResponse } from "next/server";

import { verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { dayKey, dayKeyToDate, nextStreak, storedDateToDayKey } from "@/lib/streak";
import { answerSchema, parse, parseJsonBody, uuid } from "@/lib/validation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsedId = parse(uuid, (await params).sessionId);
  if (!parsedId.ok) return parsedId.response;
  const sessionId = parsedId.data;

  const parsed = await parseJsonBody(request, answerSchema);
  if (!parsed.ok) return parsed.response;
  const { questionId, isCorrect } = parsed.data;

  // Verify session belongs to user
  const revisionSession = await prisma.revisionSession.findUnique({
    where: { id: sessionId, userId: session.userId },
  });

  if (!revisionSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // The question must belong to this session AND this user: otherwise anyone
  // could alter another user's question stats (spaced repetition, mastery).
  const question = await prisma.question.findFirst({
    where: { id: questionId, sessionId, userId: session.userId },
    select: { id: true },
  });

  if (!question) {
    return NextResponse.json({ error: "Question not found in this session" }, { status: 404 });
  }

  // One answer per question per session (no inflating progress or streaks).
  const alreadyAnswered = await prisma.questionAttempt.findFirst({
    where: { questionId, sessionId },
    select: { id: true },
  });

  if (alreadyAnswered) {
    return NextResponse.json({ error: "Question already answered" }, { status: 409 });
  }

  const updatedSession = await prisma.$transaction(async (tx) => {
    await tx.questionAttempt.create({
      data: { questionId, sessionId, isCorrect },
    });

    await tx.question.update({
      where: { id: questionId },
      data: {
        timesAsked: { increment: 1 },
        timesCorrect: isCorrect ? { increment: 1 } : undefined,
        lastAskedAt: new Date(),
      },
    });

    return tx.revisionSession.update({
      where: { id: sessionId },
      data: {
        questionsAnswered: { increment: 1 },
        correctCount: isCorrect ? { increment: 1 } : undefined,
      },
    });
  });

  // Check if session is complete
  const isComplete = updatedSession.questionsAnswered >= updatedSession.questionsTotal;

  if (isComplete) {
    await prisma.revisionSession.update({
      where: { id: sessionId },
      data: {
        status: "completed",
        completedAt: new Date(),
      },
    });

    // Update user streak
    await updateStreak(session.userId);
  }

  return NextResponse.json({
    questionsAnswered: updatedSession.questionsAnswered,
    correctCount: updatedSession.correctCount,
    isComplete,
  });
}

async function updateStreak(userId: string) {
  const streak = await prisma.userStreak.findUnique({ where: { userId } });

  const next = nextStreak(
    {
      currentStreak: streak?.currentStreak ?? 0,
      longestStreak: streak?.longestStreak ?? 0,
      lastActivityDay: streak?.lastActivityDate
        ? storedDateToDayKey(streak.lastActivityDate)
        : null,
    },
    dayKey(new Date())
  );
  if (!next) return; // Already counted today

  const data = {
    currentStreak: next.currentStreak,
    longestStreak: next.longestStreak,
    lastActivityDate: dayKeyToDate(next.lastActivityDay!),
  };
  await prisma.userStreak.upsert({
    where: { userId },
    create: { userId, ...data },
    update: data,
  });
}
