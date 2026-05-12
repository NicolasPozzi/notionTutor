import { NextResponse } from "next/server";

import { verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ digestId: string }> }
) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { digestId } = await params;

  const digest = await prisma.digest.findUnique({
    where: { id: digestId, userId: session.userId },
  });

  if (!digest) {
    return NextResponse.json({ error: "Digest not found" }, { status: 404 });
  }

  const body = await request.json();
  const { frequency, sendTime, durationDays, status } = body as {
    frequency?: string;
    sendTime?: string;
    durationDays?: number | null;
    status?: string;
  };

  const updateData: Record<string, unknown> = {};
  if (frequency) updateData.frequency = frequency;
  if (sendTime) updateData.sendTime = sendTime;
  if (durationDays !== undefined) {
    updateData.durationDays = durationDays;
    updateData.endsAt = durationDays
      ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
      : null;
  }
  if (status && ["active", "paused", "completed"].includes(status)) {
    updateData.status = status;
  }

  const updated = await prisma.digest.update({
    where: { id: digestId },
    data: updateData,
  });

  return NextResponse.json({ digest: updated });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ digestId: string }> }
) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { digestId } = await params;

  const digest = await prisma.digest.findUnique({
    where: { id: digestId, userId: session.userId },
  });

  if (!digest) {
    return NextResponse.json({ error: "Digest not found" }, { status: 404 });
  }

  await prisma.digest.delete({ where: { id: digestId } });

  return NextResponse.json({ success: true });
}
