import { NextResponse } from "next/server";

import { verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
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
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const streak = await prisma.userStreak.findUnique({
    where: { userId },
  });

  if (!streak || !streak.lastActivityDate) {
    await prisma.userStreak.upsert({
      where: { userId },
      create: {
        userId,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: today,
      },
      update: {
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: today,
      },
    });
    return;
  }

  const lastActivity = new Date(streak.lastActivityDate);
  lastActivity.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return; // Already counted today

  const newStreak = diffDays === 1 ? streak.currentStreak + 1 : 1;

  await prisma.userStreak.update({
    where: { userId },
    data: {
      currentStreak: newStreak,
      longestStreak: Math.max(newStreak, streak.longestStreak),
      lastActivityDate: today,
    },
  });
}
