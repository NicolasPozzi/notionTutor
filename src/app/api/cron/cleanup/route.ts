import { NextResponse } from "next/server";

import { isAuthorizedCron } from "@/lib/auth/cron";
import { ENCRYPTED_FIELD_PREFIX, encryptField, isEncryptedField } from "@/lib/auth/encryption";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  if (!isAuthorizedCron(request)) {
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

  const encryptedQuestions = await encryptLegacyQuestions();

  return NextResponse.json({
    status: "ok",
    job: "cleanup",
    expiredDigests: expired.count,
    abandonedSessions: abandoned.count,
    encryptedQuestions,
  });
}

const LEGACY_BATCH_SIZE = 500;

/**
 * Encrypt question rows written in plaintext before field encryption existed.
 * Runs here (in prod, with the real ENCRYPTION_KEY) rather than as a local
 * script. Idempotent: already-encrypted rows are skipped by the prefix filter.
 */
async function encryptLegacyQuestions(): Promise<number> {
  const legacy = await prisma.question.findMany({
    where: { NOT: { questionText: { startsWith: ENCRYPTED_FIELD_PREFIX } } },
    select: { id: true, questionText: true, answerExcerpt: true },
    take: LEGACY_BATCH_SIZE,
  });

  for (const q of legacy) {
    await prisma.question.update({
      where: { id: q.id },
      data: {
        questionText: encryptField(q.questionText),
        answerExcerpt:
          q.answerExcerpt === null || isEncryptedField(q.answerExcerpt)
            ? q.answerExcerpt
            : encryptField(q.answerExcerpt),
      },
    });
  }

  return legacy.length;
}
