import { NextResponse } from "next/server";

import { getPageContent } from "@/lib/adapters/notion";
import { decrypt } from "@/lib/auth/encryption";
import { verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { logError } from "@/lib/log";
import { notionPageId, parse } from "@/lib/validation";

export async function GET(_request: Request, { params }: { params: Promise<{ pageId: string }> }) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsedId = parse(notionPageId, (await params).pageId);
  if (!parsedId.ok) return parsedId.response;
  const pageId = parsedId.data;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { notionToken: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!user.notionToken) {
    return NextResponse.json(
      { error: "Notion déconnecté", notionConnected: false },
      { status: 409 }
    );
  }

  try {
    const token = decrypt(user.notionToken);
    const content = await getPageContent(token, pageId);
    return NextResponse.json(content);
  } catch (err) {
    logError("Notion page content error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du contenu" },
      { status: 500 }
    );
  }
}
