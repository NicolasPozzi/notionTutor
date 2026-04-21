/**
 * Utility function to conditionally join class names
 * Tailwind CSS compatible
 *
 * TODO: Consider upgrading to clsx + tailwind-merge in Epic 1+ for:
 * - Better class deduplication (e.g., "p-2 p-4" → "p-4")
 * - Conflict resolution (e.g., "text-red-500 text-blue-500" → last wins)
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Format a date for display in French locale
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Format a relative time (e.g., "il y a 2 heures")
 */
export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - d.getTime()) / 1000);

  if (diffInSeconds < 60) return "à l'instant";
  if (diffInSeconds < 3600) return `il y a ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `il y a ${Math.floor(diffInSeconds / 3600)}h`;
  if (diffInSeconds < 604800) return `il y a ${Math.floor(diffInSeconds / 86400)}j`;

  return formatDate(d);
}

/**
 * Sleep utility for rate limiting and backoff
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
