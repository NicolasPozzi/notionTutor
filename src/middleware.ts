import { jwtVerify } from "jose";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "notiontutor_session";

const PUBLIC_PATHS = [
  "/",
  "/security",
  "/api/auth",
  "/api/health",
  "/api/cron",
  "/api/digests/unsubscribe",
];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(path + "/"));
}

function getSecret(): Uint8Array {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is required");
  }
  return new TextEncoder().encode(secret);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public paths
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  // Allow static assets and Next.js internals
  if (pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  // Check session token
  const token = request.cookies.get(COOKIE_NAME)?.value;

  if (!token) {
    return redirectToLogin(request);
  }

  try {
    await jwtVerify(token, getSecret());
    return NextResponse.next();
  } catch {
    // Token expired or invalid → redirect with re-login hint
    return redirectToLogin(request, true);
  }
}

function redirectToLogin(request: NextRequest, expired = false): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = "/";
  if (expired) {
    url.searchParams.set("error", "session_expired");
  }
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
