/**
 * Per-user usage quotas.
 *
 * Every revision costs a Notion fetch and an OpenAI call, and every active
 * digest costs both again each day in the cron. Without limits, one account
 * could exhaust the monthly OpenAI budget (taking question generation down for
 * everyone) or stall the cron. The values are generous for normal use.
 */
export const MAX_REVISIONS_PER_DAY = 20;
export const MAX_ACTIVE_DIGESTS = 10;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Start of the rolling 24h window used for the revision quota. */
export function revisionQuotaWindowStart(now = new Date()): Date {
  return new Date(now.getTime() - DAY_MS);
}
