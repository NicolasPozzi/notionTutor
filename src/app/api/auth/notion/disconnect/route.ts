import { NextResponse } from "next/server";

import { revokeStoredNotionToken } from "@/lib/adapters/notion/oauth";
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

  // Already disconnected (null token) is a no-op: idempotent.
  await revokeStoredNotionToken(user.notionToken);

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
