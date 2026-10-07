import { SignJWT } from "jose";
import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { middleware } from "@/middleware";

const req = (path: string, cookie?: string) =>
  new NextRequest(`https://app.test${path}`, {
    headers: cookie ? { cookie: `notiontutor_session=${cookie}` } : {},
  });

/** NextResponse.next() sets this header; a redirect sets `location` instead. */
const passedThrough = (res: Response) => res.headers.get("x-middleware-next") === "1";

async function validToken() {
  return new SignJWT({ userId: "user-1", notionUserId: "notion-1" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1h")
    .sign(new TextEncoder().encode(process.env.SESSION_SECRET));
}

describe("middleware auth guard", () => {
  it.each(["/", "/security", "/api/auth/notion", "/api/health", "/icon.svg", "/apple-icon.png"])(
    "lets anonymous visitors reach public path %s",
    async (path) => {
      expect(passedThrough(await middleware(req(path)))).toBe(true);
    }
  );

  it.each(["/dashboard", "/dashboard/profile", "/api/pages"])(
    "redirects anonymous visitors away from %s",
    async (path) => {
      const res = await middleware(req(path));
      expect(res.headers.get("location")).toBe("https://app.test/");
    }
  );

  it.each(["/dashboard/revise/x.png", "/dashboard/profile.json", "/api/stats.svg"])(
    "does not treat nested paths with a dot as static files: %s (regression)",
    async (path) => {
      const res = await middleware(req(path));
      expect(passedThrough(res)).toBe(false);
      expect(res.headers.get("location")).toBe("https://app.test/");
    }
  );

  it("lets a valid session through and flags an invalid one as expired", async () => {
    expect(passedThrough(await middleware(req("/dashboard", await validToken())))).toBe(true);

    const res = await middleware(req("/dashboard", "not-a-jwt"));
    expect(res.headers.get("location")).toBe("https://app.test/?error=session_expired");
  });
});
