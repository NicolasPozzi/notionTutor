import { NextResponse } from "next/server";

import { searchPages } from "@/lib/adapters/notion";
import { decrypt } from "@/lib/auth/encryption";
import { verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const cursor = url.searchParams.get("cursor");

  try {
    const token = decrypt(user.notionToken);
    const result = await searchPages(token, cursor);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Notion pages fetch error:", err);

    if (err instanceof Error && err.message.includes("Circuit breaker")) {
      return NextResponse.json(
        { error: "Notion est momentanément indisponible. Réessayez dans quelques instants." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Erreur lors de la récupération des pages" },
      { status: 500 }
    );
  }
}
