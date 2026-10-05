import { NextResponse } from "next/server";

import { getQuestionGenerator } from "@/lib/adapters/llm";
import { getPageContent } from "@/lib/adapters/notion";
import { decrypt } from "@/lib/auth/encryption";
import { verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function POST(request: Request) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { notionPageId } = body as { notionPageId: string };

  if (!notionPageId) {
    return NextResponse.json({ error: "notionPageId is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { notionToken: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!user.notionToken) {
    return NextResponse.json(
      { error: "Notion déconnecté", notionConnected: false },
      { status: 409 }
    );
  }

  try {
    // 1. Fetch page content from Notion (ephemeral)
    const token = decrypt(user.notionToken);
    const pageContent = await getPageContent(token, notionPageId);

    // 2. Create revision session in DB
    const revisionSession = await prisma.revisionSession.create({
      data: {
        userId: session.userId,
        notionPageId,
        notionPageTitle: pageContent.title,
        status: "in_progress",
      },
    });

    // 3. Find existing questions to reuse (spaced repetition)
    // Priority: missed questions first, then due for review, then new
    const existingQuestions = await prisma.question.findMany({
      where: {
        userId: session.userId,
        notionPageId,
        // Exclude mastered (correct 3+ times)
        timesCorrect: { lt: 3 },
      },
      orderBy: [
        { timesCorrect: "asc" }, // Missed questions first
        { lastAskedAt: "asc" }, // Oldest asked first
      ],
      take: 3,
    });

    // 4. Generate new questions to fill remaining slots
    const newCount = Math.max(2, 5 - existingQuestions.length);
    const generator = getQuestionGenerator();
    const result = await generator.generateQuestions({
      pageContent: pageContent.content,
      count: newCount,
      notionPageId,
    });

    // 5. Save new questions to DB
    const newQuestions = await Promise.all(
      result.questions.map((q) =>
        prisma.question.create({
          data: {
            userId: session.userId,
            sessionId: revisionSession.id,
            notionPageId,
            questionText: q.question,
            answerExcerpt: q.answerExcerpt,
            lastAskedAt: new Date(),
          },
        })
      )
    );

    // 6. Link existing questions to this session
    if (existingQuestions.length > 0) {
      await prisma.question.updateMany({
        where: { id: { in: existingQuestions.map((q) => q.id) } },
        data: { sessionId: revisionSession.id, lastAskedAt: new Date() },
      });
    }

    const totalQuestions = existingQuestions.length + newQuestions.length;

    // 7. Update session with question count
    await prisma.revisionSession.update({
      where: { id: revisionSession.id },
      data: { questionsTotal: totalQuestions },
    });

    return NextResponse.json({
      sessionId: revisionSession.id,
      pageTitle: pageContent.title,
      questionsTotal: totalQuestions,
    });
  } catch (err) {
    console.error("Revision session creation error:", err);
    return NextResponse.json(
      { error: "Impossible de créer la session de révision" },
      { status: 500 }
    );
  }
}
