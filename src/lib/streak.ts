/**
 * Revision streaks, counted in calendar days of the user's timezone.
 * Days were computed in UTC (the server's timezone): in Paris, a revision at
 * 00:30 counted for the previous day and could break or double-count a streak.
 * The app's default timezone (also used by digests) is Europe/Paris.
 */
export const STREAK_TIMEZONE = "Europe/Paris";

const DAY_MS = 24 * 60 * 60 * 1000;

/** Calendar day of `date` in `timeZone`, as "YYYY-MM-DD". */
export function dayKey(date: Date, timeZone = STREAK_TIMEZONE): string {
  // en-CA formats as YYYY-MM-DD.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/** A day key as the value stored in a Postgres `date` column (UTC midnight). */
export function dayKeyToDate(key: string): Date {
  return new Date(`${key}T00:00:00.000Z`);
}

/** Day key of a value read from a Postgres `date` column (UTC midnight). */
export function storedDateToDayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export interface StreakState {
  currentStreak: number;
  longestStreak: number;
  lastActivityDay: string | null;
}

/**
 * New streak after an activity on `today` (a day key). Returns null when the
 * day was already counted.
 */
export function nextStreak(state: StreakState, today: string): StreakState | null {
  if (state.lastActivityDay === today) return null;

  const gapDays = state.lastActivityDay
    ? Math.round(
        (dayKeyToDate(today).getTime() - dayKeyToDate(state.lastActivityDay).getTime()) / DAY_MS
      )
    : Infinity;

  const currentStreak = gapDays === 1 ? state.currentStreak + 1 : 1;
  return {
    currentStreak,
    longestStreak: Math.max(currentStreak, state.longestStreak),
    lastActivityDay: today,
  };
}
