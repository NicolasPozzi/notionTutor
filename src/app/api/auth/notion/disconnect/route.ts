import { NextResponse } from "next/server";

import { decrypt } from "@/lib/auth/encryption";
import { verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

/**
 * Story 2.5 — Disconnect Notion.
 *
 * Revokes the stored Notion OAuth token (best-effort, server-side) and clears
 * it locally so NotionTutor can no longer access the workspace. The account and
 * the login session are kept intact: the user stays signed in and can reconnect
 * from /profile via the standard Notion OAuth consent flow.
 */
export async function POST() {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { notionToken: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Already disconnected — treat as success (idempotent).
  if (user.notionToken) {
    try {
      const token = decrypt(user.notionToken);
      await revokeNotionToken(token);
    } catch (err) {
      // Local invalidation below is the authoritative guarantee; a failed
      // remote revocation (network, token already invalid) must not block it.
      console.warn("Notion token revocation failed (continuing):", err);
    }
  }

  await prisma.user.update({
    where: { id: session.userId },
    data: {
      notionToken: null,
      notionWorkspaceId: null,
      notionWorkspaceName: null,
    },
  });

  return NextResponse.json({ success: true });
}

/**
 * Best-effort revocation against Notion's OAuth revoke endpoint.
 * Uses the integration's client credentials (Basic auth) per the OAuth spec.
 */
async function revokeNotionToken(token: string): Promise<void> {
  const clientId = process.env.NOTION_CLIENT_ID;
  const clientSecret = process.env.NOTION_CLIENT_SECRET;

  if (!clientId || !clientSecret) return;

  const response = await fetch("https://api.notion.com/v1/oauth/revoke", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Notion token revoke failed: ${response.status} ${body}`);
  }
}
