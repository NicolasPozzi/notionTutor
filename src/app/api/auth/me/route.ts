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
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ user });
}
