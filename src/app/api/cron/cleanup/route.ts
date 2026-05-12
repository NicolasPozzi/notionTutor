import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Mark expired digests as completed
  const expired = await prisma.digest.updateMany({
    where: {
      status: "active",
      endsAt: { lte: now },
    },
    data: { status: "completed" },
  });

  // Clean abandoned revision sessions older than 7 days
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const abandoned = await prisma.revisionSession.updateMany({
    where: {
      status: "in_progress",
      startedAt: { lte: sevenDaysAgo },
    },
    data: { status: "abandoned" },
  });

  return NextResponse.json({
    status: "ok",
    job: "cleanup",
    expiredDigests: expired.count,
    abandonedSessions: abandoned.count,
  });
}
