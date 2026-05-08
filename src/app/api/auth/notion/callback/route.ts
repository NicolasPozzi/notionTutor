import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { encrypt } from "@/lib/auth/encryption";
import { createSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const error = url.searchParams.get("error");

  // Handle OAuth errors (user denied access, etc.)
  if (error) {
    return NextResponse.redirect(new URL("/?error=oauth_denied", request.url));
  }

  if (!code || !state) {
    return NextResponse.redirect(new URL("/?error=invalid_callback", request.url));
  }

  // Validate state and get PKCE verifier from cookies
  const cookieStore = await cookies();
  const storedState = cookieStore.get("notion_oauth_state")?.value;
  const codeVerifier = cookieStore.get("notion_oauth_verifier")?.value;

  if (!storedState || state !== storedState) {
    return NextResponse.redirect(new URL("/?error=invalid_state", request.url));
  }

  if (!codeVerifier) {
    return NextResponse.redirect(new URL("/?error=missing_verifier", request.url));
  }

  // Clean up OAuth cookies
  cookieStore.delete("notion_oauth_state");
  cookieStore.delete("notion_oauth_verifier");

  try {
    // Exchange code for access token
    const tokenResponse = await exchangeCodeForToken(code, codeVerifier);

    // Fetch user info from Notion
    const notionUser = await fetchNotionUser(tokenResponse.access_token);

    // Encrypt the access token before storing
    const encryptedToken = encrypt(tokenResponse.access_token);

    // Upsert user in database
    const user = await prisma.user.upsert({
      where: { notionUserId: notionUser.id },
      create: {
        notionUserId: notionUser.id,
        email: notionUser.email,
        name: notionUser.name,
        avatarUrl: notionUser.avatarUrl,
        notionToken: encryptedToken,
        notionWorkspaceId: tokenResponse.workspace_id,
        lastLoginAt: new Date(),
      },
      update: {
        email: notionUser.email,
        name: notionUser.name,
        avatarUrl: notionUser.avatarUrl,
        notionToken: encryptedToken,
        notionWorkspaceId: tokenResponse.workspace_id,
        lastLoginAt: new Date(),
        deletedAt: null, // Reactivate if previously soft-deleted
      },
    });

    // Create JWT session
    await createSession({
      userId: user.id,
      notionUserId: user.notionUserId,
    });

    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(new URL("/?error=auth_failed", request.url));
  }
}

interface NotionTokenResponse {
  access_token: string;
  workspace_id: string;
  workspace_name: string;
  bot_id: string;
  owner: {
    type: string;
    user: {
      id: string;
      name: string;
      avatar_url: string | null;
      person: { email: string } | null;
    };
  };
}

async function exchangeCodeForToken(
  code: string,
  codeVerifier: string
): Promise<NotionTokenResponse> {
  const clientId = process.env.NOTION_CLIENT_ID!;
  const clientSecret = process.env.NOTION_CLIENT_SECRET!;
  const redirectUri = process.env.NOTION_REDIRECT_URI!;

  const response = await fetch("https://api.notion.com/v1/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Notion token exchange failed: ${response.status} ${body}`);
  }

  return response.json();
}

interface NotionUserInfo {
  id: string;
  name: string;
  email: string | null;
  avatarUrl: string | null;
}

async function fetchNotionUser(accessToken: string): Promise<NotionUserInfo> {
  const response = await fetch("https://api.notion.com/v1/users/me", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Notion-Version": "2022-06-28",
    },
  });

  if (!response.ok) {
    throw new Error(`Notion user fetch failed: ${response.status}`);
  }

  const data = await response.json();
  const user = data.bot?.owner?.user ?? data;

  return {
    id: user.id,
    name: user.name ?? "Utilisateur Notion",
    email: user.person?.email ?? null,
    avatarUrl: user.avatar_url ?? null,
  };
}
