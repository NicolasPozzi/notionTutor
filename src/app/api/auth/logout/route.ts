import { NextResponse } from "next/server";

import { clearSession, revokeAllSessions, verifySession } from "@/lib/auth/session";

export async function POST() {
  // Revoke server-side too: deleting the cookie alone left any copy of it
  // (another device, a stolen cookie) valid until expiry.
  const session = await verifySession();
  if (session) await revokeAllSessions(session.userId);

  await clearSession();
  return NextResponse.json({ success: true });
}
