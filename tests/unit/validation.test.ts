import { describe, expect, it } from "vitest";

import {
  createDigestSchema,
  historyQuerySchema,
  notionPageId,
  unsubscribeToken,
  updateDigestSchema,
} from "@/lib/validation";

describe("notionPageId", () => {
  it.each(["2a1b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d", "2a1b3c4d5e6f4a7b8c9d0e1f2a3b4c5d"])(
    "accepts Notion IDs with or without dashes: %s",
    (id) => expect(notionPageId.safeParse(id).success).toBe(true)
  );

  it.each([
    "../users",
    "2a1b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d/../../users",
    "2a1b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d?x=1",
    "",
    "deleted-page",
  ])("rejects path-traversal or malformed values: %s (regression)", (id) => {
    expect(notionPageId.safeParse(id).success).toBe(false);
  });
});

describe("digest schemas", () => {
  const id = "2a1b3c4d5e6f4a7b8c9d0e1f2a3b4c5d";

  it("truncates long Notion titles to the column size instead of failing", () => {
    const parsed = createDigestSchema.parse({ notionPageId: id, notionPageTitle: "x".repeat(800) });
    expect(parsed.notionPageTitle).toHaveLength(500);
  });

  it.each([
    [{ frequency: "hourly" }],
    [{ sendTime: "25:00" }],
    [{ durationDays: -3 }],
    [{ durationDays: 1e9 }],
    [{ durationDays: 1.5 }],
    [{ status: "deleted" }],
  ])("rejects invalid values %j", (patch) => {
    expect(updateDigestSchema.safeParse(patch).success).toBe(false);
  });

  it("accepts the values the UI sends", () => {
    expect(updateDigestSchema.parse({ status: "paused" })).toEqual({ status: "paused" });
    expect(updateDigestSchema.parse({ durationDays: null, frequency: "weekly" })).toEqual({
      durationDays: null,
      frequency: "weekly",
    });
  });
});

describe("historyQuerySchema", () => {
  it("applies defaults and coerces numbers", () => {
    expect(historyQuerySchema.parse({})).toEqual({ limit: 20, offset: 0 });
    expect(historyQuerySchema.parse({ limit: "10", offset: "40" })).toEqual({
      limit: 10,
      offset: 40,
    });
  });

  it.each([{ offset: "abc" }, { offset: "-1" }, { limit: "500" }, { limit: "0" }])(
    "rejects %j (was a 500)",
    (query) => expect(historyQuerySchema.safeParse(query).success).toBe(false)
  );
});

describe("unsubscribeToken", () => {
  it("accepts 64 hex chars only", () => {
    expect(unsubscribeToken.safeParse("a".repeat(64)).success).toBe(true);
    expect(unsubscribeToken.safeParse("a".repeat(63)).success).toBe(false);
    expect(unsubscribeToken.safeParse("not-a-real-token").success).toBe(false);
  });
});
