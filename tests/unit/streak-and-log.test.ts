import { describe, expect, it } from "vitest";

import { summarizeError } from "@/lib/log";
import { dayKey, dayKeyToDate, nextStreak, storedDateToDayKey } from "@/lib/streak";

describe("dayKey (Europe/Paris)", () => {
  it("counts 00:30 in Paris as the Paris day, not the UTC day (regression)", () => {
    // 2026-10-06T22:30Z is 2026-10-07 00:30 in Paris (UTC+2 in summer time).
    expect(dayKey(new Date("2026-10-06T22:30:00Z"))).toBe("2026-10-07");
    // Winter time (UTC+1): 2026-12-31T23:30Z is 2027-01-01 00:30 in Paris.
    expect(dayKey(new Date("2026-12-31T23:30:00Z"))).toBe("2027-01-01");
  });

  it("round-trips through the Postgres date representation", () => {
    expect(storedDateToDayKey(dayKeyToDate("2026-10-07"))).toBe("2026-10-07");
  });
});

describe("nextStreak", () => {
  const state = (currentStreak: number, longestStreak: number, lastActivityDay: string | null) => ({
    currentStreak,
    longestStreak,
    lastActivityDay,
  });

  it("starts at 1 on the first activity", () => {
    expect(nextStreak(state(0, 0, null), "2026-10-07")).toEqual(state(1, 1, "2026-10-07"));
  });

  it("doesn't count the same day twice", () => {
    expect(nextStreak(state(3, 5, "2026-10-07"), "2026-10-07")).toBeNull();
  });

  it("extends on consecutive days, across month and DST boundaries", () => {
    expect(nextStreak(state(3, 5, "2026-10-31"), "2026-11-01")).toEqual(state(4, 5, "2026-11-01"));
    expect(nextStreak(state(5, 5, "2026-10-24"), "2026-10-25")).toEqual(state(6, 6, "2026-10-25"));
  });

  it("resets after a missed day but keeps the record", () => {
    expect(nextStreak(state(4, 9, "2026-10-05"), "2026-10-07")).toEqual(state(1, 9, "2026-10-07"));
  });

  it("keeps the record when the last activity date is missing (old code reset it to 1)", () => {
    expect(nextStreak(state(0, 7, null), "2026-10-07")).toEqual(state(1, 7, "2026-10-07"));
  });
});

describe("summarizeError", () => {
  it("keeps only the first line of Prisma-style errors (no query arguments)", () => {
    const err = Object.assign(
      new Error(
        '\nInvalid `prisma.user.update()` invocation:\n{ data: { email: "me@example.com" } }'
      ),
      { name: "PrismaClientValidationError", code: "P2002" }
    );
    const summary = summarizeError(err);

    expect(summary).toBe(
      "PrismaClientValidationError code=P2002 Invalid `prisma.user.update()` invocation:"
    );
    expect(summary).not.toContain("me@example.com");
  });

  it("includes the HTTP status of API errors and truncates long messages", () => {
    const err = Object.assign(new Error("x".repeat(1000)), { name: "NotionApiError", status: 404 });
    const summary = summarizeError(err);
    expect(summary.startsWith("NotionApiError status=404 ")).toBe(true);
    expect(summary.length).toBeLessThan(330);
  });

  it("handles non-Error values", () => {
    expect(summarizeError("boom")).toBe("boom");
  });
});
