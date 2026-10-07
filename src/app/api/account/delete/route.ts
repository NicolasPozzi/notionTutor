import { NextResponse } from "next/server";

import { revokeStoredNotionToken } from "@/lib/adapters/notion/oauth";
import { clearSession, verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function DELETE() {
  const session = await verifySession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Revoke NotionTutor's access at Notion too (as "Déconnecter Notion" does):
  // deleting the account used to leave the integration authorized in Notion.
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { notionToken: true },
  });
  await revokeStoredNotionToken(user?.notionToken ?? null);

  // Hard delete: cascading delete will remove all related data
  // (sessions, questions, attempts, digests, streak)
  await prisma.user.delete({
    where: { id: session.userId },
  });

  // Clear session cookie
  await clearSession();

  return NextResponse.json({ success: true });
}
