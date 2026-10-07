import crypto from "node:crypto";

/**
 * Whether a request carries the cron secret (Vercel sends
 * `Authorization: Bearer <CRON_SECRET>`).
 *
 * Fails closed: if CRON_SECRET isn't configured, every call is rejected —
 * otherwise "Bearer undefined" would be accepted. Constant-time comparison.
 */
export function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const provided = Buffer.from(request.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);

  return provided.length === expected.length && crypto.timingSafeEqual(provided, expected);
}
