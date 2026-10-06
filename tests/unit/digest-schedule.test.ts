import { describe, expect, it } from "vitest";

import { isDigestDue } from "@/lib/digests/schedule";

const HOUR = 3_600_000;
const now = new Date("2026-10-06T06:05:00Z");
const hoursAgo = (h: number) => new Date(now.getTime() - h * HOUR);

describe("isDigestDue", () => {
  it("sends a digest that was never sent, whatever the frequency", () => {
    expect(isDigestDue({ frequency: "daily", lastSentAt: null }, now)).toBe(true);
    expect(isDigestDue({ frequency: "weekly", lastSentAt: null }, now)).toBe(true);
  });

  it("daily: sends again the next day, even if yesterday's cron ran later", () => {
    expect(isDigestDue({ frequency: "daily", lastSentAt: hoursAgo(23.2) }, now)).toBe(true);
    expect(isDigestDue({ frequency: "daily", lastSentAt: hoursAgo(1) }, now)).toBe(false);
  });

  it("weekly: does not send on the following days (regression: was sent daily)", () => {
    for (const days of [1, 3, 6]) {
      expect(isDigestDue({ frequency: "weekly", lastSentAt: hoursAgo(days * 24) }, now)).toBe(
        false
      );
    }
    expect(isDigestDue({ frequency: "weekly", lastSentAt: hoursAgo(7 * 24 - 0.9) }, now)).toBe(
      true
    );
  });

  it.each([
    ["daily", 28],
    ["weekly", 4],
  ] as const)("%s: %i sends over 28 daily cron runs with drift", (frequency, expected) => {
    let lastSentAt: Date | null = null;
    let sends = 0;
    for (let day = 0; day < 28; day++) {
      // Vercel may fire the 06:00 cron anywhere in the hour; alternate early/late.
      const minute = day % 2 === 0 ? 55 : 0;
      const run = new Date(Date.UTC(2026, 9, 1 + day, 6, minute));
      if (isDigestDue({ frequency, lastSentAt }, run)) {
        sends++;
        lastSentAt = run;
      }
    }
    expect(sends).toBe(expected);
  });
});
