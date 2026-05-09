import { NextResponse } from "next/server";

import { verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId } = await params;
  const body = await request.json();
  const { questionId, isCorrect } = body as {
    questionId: string;
    isCorrect: boolean;
  };

  if (!questionId || typeof isCorrect !== "boolean") {
    return NextResponse.json({ error: "questionId and isCorrect are required" }, { status: 400 });
  }

  // Verify session belongs to user
  const revisionSession = await prisma.revisionSession.findUnique({
    where: { id: sessionId, userId: session.userId },
  });

  if (!revisionSession) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Create attempt
  await prisma.questionAttempt.create({
    data: {
      questionId,
      sessionId,
      isCorrect,
    },
  });

  // Update question stats
  await prisma.question.update({
    where: { id: questionId },
    data: {
      timesAsked: { increment: 1 },
      timesCorrect: isCorrect ? { increment: 1 } : undefined,
      lastAskedAt: new Date(),
    },
  });

  // Update session progress
  const updatedSession = await prisma.revisionSession.update({
    where: { id: sessionId },
    data: {
      questionsAnswered: { increment: 1 },
      correctCount: isCorrect ? { increment: 1 } : undefined,
    },
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
