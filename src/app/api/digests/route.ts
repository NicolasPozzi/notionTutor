import crypto from "node:crypto";

import { NextResponse } from "next/server";

import { verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { MAX_ACTIVE_DIGESTS } from "@/lib/limits";
import { createDigestSchema, parseJsonBody } from "@/lib/validation";

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

  const parsed = await parseJsonBody(request, createDigestSchema);
  if (!parsed.ok) return parsed.response;
  const { notionPageId, notionPageTitle, frequency, sendTime, durationDays } = parsed.data;

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

  // Quota: every active digest costs a Notion fetch and an OpenAI call per day.
  const activeDigests = await prisma.digest.count({
    where: { userId: session.userId, status: { not: "completed" } },
  });
  if (activeDigests >= MAX_ACTIVE_DIGESTS) {
    return NextResponse.json(
      {
        error: `Limite atteinte : ${MAX_ACTIVE_DIGESTS} digests actifs maximum. Supprimez-en un pour en ajouter un autre.`,
      },
      { status: 429 }
    );
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
