import { describe, expect, it, vi } from "vitest";

import { CircuitBreaker } from "@/lib/adapters/llm/circuit-breaker";
import { getPageContent, NotionApiError } from "@/lib/adapters/notion";
import { isNotionOutage } from "@/lib/adapters/notion/client";

const fail = (error: unknown) => () => Promise.reject(error);

describe("CircuitBreaker", () => {
  it("opens after N consecutive outages and fails fast", async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 60_000 });
    for (let i = 0; i < 3; i++)
      await expect(breaker.execute(fail(new Error("down")))).rejects.toThrow();

    expect(breaker.getState()).toBe("open");
    const fn = vi.fn();
    await expect(breaker.execute(fn)).rejects.toThrow("Circuit breaker is open");
    expect(fn).not.toHaveBeenCalled();
  });

  it("ignores errors that are not outages and resets the count", async () => {
    const breaker = new CircuitBreaker({ failureThreshold: 3, isOutage: (e) => e !== "client" });

    await expect(breaker.execute(fail(new Error("down")))).rejects.toThrow();
    await expect(breaker.execute(fail(new Error("down")))).rejects.toThrow();
    for (let i = 0; i < 10; i++)
      await expect(breaker.execute(fail("client"))).rejects.toBe("client");
    await expect(breaker.execute(fail(new Error("down")))).rejects.toThrow();

    expect(breaker.getState()).toBe("closed");
  });
});

describe("isNotionOutage", () => {
  it.each([400, 401, 403, 404, 409])("HTTP %i is not an outage", (status) => {
    expect(isNotionOutage(new NotionApiError(status, "x"))).toBe(false);
  });

  it.each([429, 500, 502, 503])("HTTP %i is an outage", (status) => {
    expect(isNotionOutage(new NotionApiError(status, "x"))).toBe(true);
  });

  it("treats network errors and timeouts as outages", () => {
    expect(isNotionOutage(new TypeError("fetch failed"))).toBe(true);
    expect(isNotionOutage(new DOMException("timeout", "TimeoutError"))).toBe(true);
  });
});

describe("Notion client breaker (regression)", () => {
  it("10 failing pages (404) from one user don't cut Notion off for the next request", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (input) => {
      if (String(input).includes("deleted-page")) {
        return new Response('{"code":"object_not_found"}', { status: 404 });
      }
      return String(input).includes("/children")
        ? Response.json({ results: [] })
        : Response.json({ properties: {} });
    });

    for (let i = 0; i < 10; i++) {
      const err = await getPageContent("token", "deleted-page").catch((e) => e);
      expect(err).toBeInstanceOf(NotionApiError);
      expect(err.status).toBe(404);
    }

    // Before the fix, the shared breaker was open here: "Circuit breaker is open".
    await expect(getPageContent("token", "healthy-page")).resolves.toMatchObject({
      pageId: "healthy-page",
    });
    expect(fetchMock).toHaveBeenCalled();
  });
});
