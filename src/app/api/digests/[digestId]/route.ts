import { NextResponse } from "next/server";

import { verifySession } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { parse, parseJsonBody, updateDigestSchema, uuid } from "@/lib/validation";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ digestId: string }> }
) {
  const session = await verifySession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsedId = parse(uuid, (await params).digestId);
  if (!parsedId.ok) return parsedId.response;
  const digestId = parsedId.data;

  const digest = await prisma.digest.findUnique({
    where: { id: digestId, userId: session.userId },
  });

  if (!digest) {
    return NextResponse.json({ error: "Digest not found" }, { status: 404 });
  }

  const parsed = await parseJsonBody(request, updateDigestSchema);
  if (!parsed.ok) return parsed.response;
  const { frequency, sendTime, durationDays, status } = parsed.data;

  const updateData: Record<string, unknown> = {};
  if (frequency) updateData.frequency = frequency;
  if (sendTime) updateData.sendTime = sendTime;
  if (durationDays !== undefined) {
    updateData.durationDays = durationDays;
    updateData.endsAt = durationDays
      ? new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000)
      : null;
  }
  if (status) updateData.status = status;

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

  const parsedId = parse(uuid, (await params).digestId);
  if (!parsedId.ok) return parsedId.response;
  const digestId = parsedId.data;

  const digest = await prisma.digest.findUnique({
    where: { id: digestId, userId: session.userId },
  });

  if (!digest) {
    return NextResponse.json({ error: "Digest not found" }, { status: 404 });
  }

  await prisma.digest.delete({ where: { id: digestId } });

  return NextResponse.json({ success: true });
}
