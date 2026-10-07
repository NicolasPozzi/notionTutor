import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { parse, unsubscribeToken } from "@/lib/validation";

type Params = { params: Promise<{ token: string }> };

/**
 * GET only shows a confirmation page: mail security scanners (Outlook Safe
 * Links, corporate gateways) open every link in an email, so a GET that
 * unsubscribes silently unsubscribed people who never clicked.
 */
export async function GET(_request: Request, { params }: Params) {
  const digest = await findDigest((await params).token);
  if (!digest) return invalidLink();

  return htmlPage(
    "Se désabonner",
    `<h1>Se désabonner ?</h1>
<p>Vous ne recevrez plus le digest pour <strong>${escapeHtml(digest.notionPageTitle ?? "cette page")}</strong>.</p>
<form method="POST"><button type="submit">Confirmer le désabonnement</button></form>
<p><a href="/dashboard/digests">Gérer mes digests</a></p>`
  );
}

/**
 * POST unsubscribes. Also the target of RFC 8058 one-click unsubscribe
 * (`List-Unsubscribe-Post` header), which mail clients send as a POST.
 */
export async function POST(_request: Request, { params }: Params) {
  const digest = await findDigest((await params).token);
  if (!digest) return invalidLink();

  await prisma.digest.update({
    where: { id: digest.id },
    data: { status: "paused" },
  });

  return htmlPage(
    "Désabonné",
    `<h1>✅ Désabonné</h1>
<p>Vous ne recevrez plus de digest pour cette page.</p>
<p>Vous pouvez réactiver le digest depuis votre <a href="/dashboard/digests">tableau de bord</a>.</p>`
  );
}

async function findDigest(token: string) {
  const parsed = parse(unsubscribeToken, token);
  if (!parsed.ok) return null;
  return prisma.digest.findUnique({
    where: { unsubscribeToken: parsed.data },
    select: { id: true, notionPageTitle: true },
  });
}

function invalidLink() {
  return htmlPage(
    "Lien invalide",
    `<h1>Lien invalide ou expiré</h1>
<p>Gérez vos digests depuis votre <a href="/dashboard/digests">tableau de bord</a>.</p>`,
    404
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function htmlPage(title: string, body: string, status = 200) {
  return new NextResponse(
    `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title} — NotionTutor</title>
<style>body{font-family:system-ui;display:flex;justify-content:center;align-items:center;min-height:100vh;margin:0;background:#F7F6F3}
.card{background:#fff;border-radius:12px;padding:2rem;max-width:400px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.1)}
h1{font-size:1.25rem;color:#37352F}p{color:#787774;font-size:0.875rem}
a{color:#2EAADC;text-decoration:none}
button{background:#2EAADC;color:#fff;border:0;border-radius:8px;padding:.75rem 1.25rem;font-size:.875rem;font-weight:600;cursor:pointer}</style></head>
<body><div class="card">
${body}
</div></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
