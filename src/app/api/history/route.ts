import { NextResponse } from "next/server";

import { verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "20", 10), 50);
  const offset = parseInt(url.searchParams.get("offset") ?? "0", 10);

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
