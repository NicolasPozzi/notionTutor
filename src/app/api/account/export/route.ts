import { NextResponse } from "next/server";

import { decryptField } from "@/lib/auth/encryption";
import { verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await verifySession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      name: true,
      avatarUrl: true,
      createdAt: true,
      lastLoginAt: true,
      notionWorkspaceId: true,
      notionWorkspaceName: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Fetch sessions with question attempts
  const sessions = await prisma.revisionSession.findMany({
    where: { userId: session.userId },
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
    orderBy: { startedAt: "desc" },
  });

  // Fetch question attempts
  const attempts = await prisma.questionAttempt.findMany({
    where: { question: { userId: session.userId } },
    select: {
      isCorrect: true,
      attemptedAt: true,
      question: {
        select: {
          questionText: true,
          notionPageId: true,
        },
      },
    },
    orderBy: { attemptedAt: "desc" },
  });

  // All generated questions (including never-answered ones) with their excerpts
  const questions = await prisma.question.findMany({
    where: { userId: session.userId },
    select: {
      notionPageId: true,
      questionText: true,
      answerExcerpt: true,
      timesAsked: true,
      timesCorrect: true,
      lastAskedAt: true,
      nextReviewAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const digests = await prisma.digest.findMany({
    where: { userId: session.userId },
    select: {
      notionPageId: true,
      notionPageTitle: true,
      frequency: true,
      sendTime: true,
      timezone: true,
      durationDays: true,
      status: true,
      startedAt: true,
      endsAt: true,
      lastSentAt: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const streak = await prisma.userStreak.findUnique({
    where: { userId: session.userId },
    select: { currentStreak: true, longestStreak: true, lastActivityDate: true },
  });

  const exportData = {
    exportedAt: new Date().toISOString(),
    account: {
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      workspaceId: user.notionWorkspaceId,
      workspaceName: user.notionWorkspaceName,
    },
    sessions: sessions.map((s) => ({
      notionPageId: s.notionPageId,
      pageTitle: s.notionPageTitle,
      status: s.status,
      questionsTotal: s.questionsTotal,
      questionsAnswered: s.questionsAnswered,
      correctCount: s.correctCount,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
    })),
    questionAttempts: attempts.map((a) => ({
      questionText: decryptField(a.question.questionText),
      notionPageId: a.question.notionPageId,
      isCorrect: a.isCorrect,
      attemptedAt: a.attemptedAt,
    })),
    questions: questions.map((q) => ({
      ...q,
      questionText: decryptField(q.questionText),
      answerExcerpt: decryptField(q.answerExcerpt),
    })),
    digests,
    streak,
  };

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="notiontutor-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
