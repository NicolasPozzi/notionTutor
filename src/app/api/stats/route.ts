import { NextResponse } from "next/server";

import { verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [totalSessions, completedSessions, streak, totalAttempts, correctAttempts, activeDigests] =
    await Promise.all([
      prisma.revisionSession.count({ where: { userId: session.userId } }),
      prisma.revisionSession.count({
        where: { userId: session.userId, status: "completed" },
      }),
      prisma.userStreak.findUnique({ where: { userId: session.userId } }),
      prisma.questionAttempt.count({
        where: { question: { userId: session.userId } },
      }),
      prisma.questionAttempt.count({
        where: { question: { userId: session.userId }, isCorrect: true },
      }),
      prisma.digest.count({
        where: { userId: session.userId, status: "active" },
      }),
    ]);

  // Mastered questions (correct 3+ times with 100% rate)
  const masteredQuestions = await prisma.question.count({
    where: {
      userId: session.userId,
      timesCorrect: { gte: 3 },
    },
  });

  return NextResponse.json({
    stats: {
      totalSessions,
      completedSessions,
      totalAttempts,
      correctAttempts,
      accuracyRate: totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0,
      masteredQuestions,
      activeDigests,
    },
    streak: streak
      ? {
          current: streak.currentStreak,
          longest: streak.longestStreak,
          lastActivity: streak.lastActivityDate,
        }
      : { current: 0, longest: 0, lastActivity: null },
  });
}
