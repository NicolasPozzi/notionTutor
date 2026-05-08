import crypto from "node:crypto";

import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.NOTION_CLIENT_ID;
  const redirectUri = process.env.NOTION_REDIRECT_URI;

  if (!clientId || !redirectUri) {
    return NextResponse.json({ error: "Notion OAuth not configured" }, { status: 500 });
  }

  // Generate PKCE code verifier and challenge
  const codeVerifier = crypto.randomBytes(32).toString("base64url");
  const codeChallenge = crypto.createHash("sha256").update(codeVerifier).digest("base64url");

  // Generate state for CSRF protection
  const state = crypto.randomBytes(16).toString("hex");

  // Store PKCE verifier and state in cookies for callback validation
  const cookieStore = await cookies();
  cookieStore.set("notion_oauth_verifier", codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });
  cookieStore.set("notion_oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    owner: "user",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });

  const notionAuthUrl = `https://api.notion.com/v1/oauth/authorize?${params.toString()}`;

  return NextResponse.redirect(notionAuthUrl);
}
