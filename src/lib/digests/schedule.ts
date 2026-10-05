const HOUR_MS = 60 * 60 * 1000;

// The send-digests cron runs once a day (Vercel Hobby limit), and Vercel may
// fire it anywhere within the scheduled hour. The margins below absorb that
// drift so a digest is never skipped because the previous run was a bit late.
const DAILY_MIN_GAP_MS = 20 * HOUR_MS;
const WEEKLY_MIN_GAP_MS = 7 * 24 * HOUR_MS - 4 * HOUR_MS;

export interface DigestScheduleInput {
  frequency: string; // "daily" | "weekly"
  lastSentAt: Date | null;
}

/**
 * Whether a digest should be sent on the current daily cron run.
 * Never-sent digests are always due; afterwards the gap depends on frequency.
 */
export function isDigestDue(digest: DigestScheduleInput, now: Date): boolean {
  if (!digest.lastSentAt) return true;

  const elapsed = now.getTime() - digest.lastSentAt.getTime();
  const minGap = digest.frequency === "weekly" ? WEEKLY_MIN_GAP_MS : DAILY_MIN_GAP_MS;

  return elapsed >= minGap;
}
