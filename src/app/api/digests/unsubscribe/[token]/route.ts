import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const digest = await prisma.digest.findUnique({
    where: { unsubscribeToken: token },
  });

  if (!digest) {
    return NextResponse.json({ error: "Lien invalide ou expiré" }, { status: 404 });
  }

  await prisma.digest.update({
    where: { id: digest.id },
    data: { status: "paused" },
  });

  // Return a simple HTML page
  return new NextResponse(
    `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><title>Désabonné</title>
<style>body{font-family:system-ui;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#F7F6F3}
.card{background:#fff;border-radius:12px;padding:2rem;max-width:400px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.1)}
h1{font-size:1.25rem;color:#37352F}p{color:#787774;font-size:0.875rem}
a{color:#2EAADC;text-decoration:none}</style></head>
<body><div class="card">
<h1>✅ Désabonné</h1>
<p>Vous ne recevrez plus de digest pour cette page.</p>
<p>Vous pouvez réactiver le digest depuis votre <a href="/dashboard/digests">tableau de bord</a>.</p>
</div></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
