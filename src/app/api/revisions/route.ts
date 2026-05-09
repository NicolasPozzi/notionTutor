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

    // 3. Generate questions via LLM
    const generator = getQuestionGenerator();
    const result = await generator.generateQuestions({
      pageContent: pageContent.content,
      count: 5,
      notionPageId,
    });

    // 4. Save questions to DB
    const questions = await Promise.all(
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

    // 5. Update session with question count
    await prisma.revisionSession.update({
      where: { id: revisionSession.id },
      data: { questionsTotal: questions.length },
    });

    return NextResponse.json({
      sessionId: revisionSession.id,
      pageTitle: pageContent.title,
      questionsTotal: questions.length,
    });
  } catch (err) {
    console.error("Revision session creation error:", err);
    return NextResponse.json(
      { error: "Impossible de créer la session de révision" },
      { status: 500 }
    );
  }
}
