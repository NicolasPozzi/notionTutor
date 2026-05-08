import { NextResponse } from "next/server";

import { clearSession, verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function DELETE() {
  const session = await verifySession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Hard delete: cascading delete will remove all related data
  // (sessions, questions, attempts, digests, streak)
  await prisma.user.delete({
    where: { id: session.userId },
  });

  // Clear session cookie
  await clearSession();

  return NextResponse.json({ success: true });
}
