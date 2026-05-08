import { NextResponse } from "next/server";

import { getPageContent } from "@/lib/adapters/notion";
import { decrypt } from "@/lib/auth/encryption";
import { verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ pageId: string }> }) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { pageId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { notionToken: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  try {
    const token = decrypt(user.notionToken);
    const content = await getPageContent(token, pageId);
    return NextResponse.json(content);
  } catch (err) {
    console.error("Notion page content error:", err);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du contenu" },
      { status: 500 }
    );
  }
}
