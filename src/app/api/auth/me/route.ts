import { NextResponse } from "next/server";

import { verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await verifySession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      notionUserId: true,
      email: true,
      name: true,
      avatarUrl: true,
      createdAt: true,
      lastLoginAt: true,
      notionToken: true,
      notionWorkspaceName: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Never leak the token itself — only expose whether Notion is connected.
  const notionConnected = user.notionToken !== null;
  const { notionToken: _notionToken, ...safeUser } = user;
  void _notionToken;

  return NextResponse.json({
    user: {
      ...safeUser,
      notionConnected,
    },
  });
}
