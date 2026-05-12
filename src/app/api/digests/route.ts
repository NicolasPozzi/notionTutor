import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const digests = await prisma.digest.findMany({
    where: { userId: session.userId, status: { not: "completed" } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      notionPageId: true,
      notionPageTitle: true,
      frequency: true,
      sendTime: true,
      durationDays: true,
      startedAt: true,
      endsAt: true,
      lastSentAt: true,
      status: true,
    },
  });

  return NextResponse.json({ digests });
}

export async function POST(request: Request) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { notionPageId, notionPageTitle, frequency, sendTime, durationDays } = body as {
    notionPageId: string;
    notionPageTitle?: string;
    frequency?: string;
    sendTime?: string;
    durationDays?: number | null;
  };

  if (!notionPageId) {
    return NextResponse.json({ error: "notionPageId is required" }, { status: 400 });
  }

  // Check if digest already exists for this page
  const existing = await prisma.digest.findFirst({
    where: {
      userId: session.userId,
      notionPageId,
      status: { not: "completed" },
    },
  });

  if (existing) {
    return NextResponse.json({ error: "Digest already active for this page" }, { status: 409 });
  }

  const now = new Date();
  const endsAt = durationDays ? new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000) : null;

  const digest = await prisma.digest.create({
    data: {
      userId: session.userId,
      notionPageId,
      notionPageTitle: notionPageTitle ?? null,
      frequency: frequency ?? "daily",
      sendTime: sendTime ?? "08:00",
      durationDays: durationDays ?? null,
      endsAt,
      unsubscribeToken: crypto.randomBytes(32).toString("hex"),
    },
  });

  return NextResponse.json({ digest }, { status: 201 });
}
