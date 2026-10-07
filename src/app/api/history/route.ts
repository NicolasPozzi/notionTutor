import { NextResponse } from "next/server";

import { verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { historyQuerySchema, parse } from "@/lib/validation";

export async function GET(request: Request) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const query = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = parse(historyQuerySchema, query);
  if (!parsed.ok) return parsed.response;
  const { limit, offset } = parsed.data;

  const sessions = await prisma.revisionSession.findMany({
    where: { userId: session.userId },
    orderBy: { startedAt: "desc" },
    skip: offset,
    take: limit,
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

  const total = await prisma.revisionSession.count({
    where: { userId: session.userId },
  });

  return NextResponse.json({ sessions, total });
}
