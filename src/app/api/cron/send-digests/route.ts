import { NextResponse } from "next/server";
import { Resend } from "resend";

import { getQuestionGenerator } from "@/lib/adapters/llm";
import { getPageContent } from "@/lib/adapters/notion";
import { decrypt } from "@/lib/auth/encryption";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Created per request (not at module load) so `next build` doesn't need the key.
  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 });
  }
  const resend = new Resend(process.env.RESEND_API_KEY);

  const now = new Date();
  const currentTime = `${String(now.getUTCHours()).padStart(2, "0")}:00`;

  // Find active digests due to be sent
  const digests = await prisma.digest.findMany({
    where: {
      status: "active",
      sendTime: currentTime,
      OR: [{ endsAt: null }, { endsAt: { gt: now } }],
    },
    include: {
      user: { select: { email: true, name: true, notionToken: true } },
    },
  });

  let sent = 0;
  let errors = 0;

  for (const digest of digests) {
    try {
      if (!digest.user.email || !digest.user.notionToken) continue;

      // Fetch page content (ephemeral)
      const token = decrypt(digest.user.notionToken);
      const page = await getPageContent(token, digest.notionPageId);

      // Generate 1 micro-question
      const generator = getQuestionGenerator();
      const result = await generator.generateQuestions({
        pageContent: page.content,
        count: 1,
        notionPageId: digest.notionPageId,
      });

      const question = result.questions[0];
      if (!question) continue;

      // Extract highlight (first 250 chars of content)
      const highlight = page.content.slice(0, 250).trim() + (page.content.length > 250 ? "…" : "");

      const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://notiontutor.vercel.app";
      const unsubUrl = `${appUrl}/api/digests/unsubscribe/${digest.unsubscribeToken}`;

      // Send email via Resend
      await resend.emails.send({
        from: "NotionTutor <digest@notiontutor.com>",
        to: digest.user.email,
        subject: `📚 ${digest.notionPageTitle ?? "Votre révision"} — Question du jour`,
        html: buildDigestEmail({
          userName: digest.user.name ?? "Utilisateur",
          pageTitle: digest.notionPageTitle ?? page.title,
          highlight,
          question: question.question,
          answer: question.answerExcerpt,
          unsubscribeUrl: unsubUrl,
        }),
      });

      // Update last sent
      await prisma.digest.update({
        where: { id: digest.id },
        data: { lastSentAt: now },
      });

      sent++;
    } catch (err) {
      console.error(`Digest send error for ${digest.id}:`, err);
      errors++;
    }
  }

  return NextResponse.json({
    status: "ok",
    job: "send-digests",
    sent,
    errors,
    total: digests.length,
  });
}

interface DigestEmailData {
  userName: string;
  pageTitle: string;
  highlight: string;
  question: string;
  answer: string;
  unsubscribeUrl: string;
}

function buildDigestEmail(data: DigestEmailData): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
body{margin:0;padding:0;background:#F7F6F3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif}
.container{max-width:600px;margin:0 auto;padding:24px}
.card{background:#fff;border-radius:12px;padding:24px;margin-bottom:16px;border:1px solid #E9E9E7}
h1{font-size:18px;color:#37352F;margin:0 0 8px}
h2{font-size:16px;color:#37352F;margin:0 0 12px}
p{font-size:14px;color:#787774;line-height:1.6;margin:0 0 12px}
.highlight{background:#F7F6F3;border-left:3px solid #2EAADC;padding:12px 16px;border-radius:4px;margin-bottom:16px}
.highlight p{color:#37352F;font-style:italic}
.question{background:#2EAADC10;border:1px solid #2EAADC30;border-radius:8px;padding:16px;margin-bottom:16px}
.question p{color:#37352F;font-weight:500;font-size:16px}
.answer{background:#0F7B6C10;border:1px solid #0F7B6C30;border-radius:8px;padding:16px}
.answer p{color:#37352F}
.footer{text-align:center;margin-top:24px;padding-top:16px;border-top:1px solid #E9E9E7}
.footer a{color:#787774;font-size:12px;text-decoration:underline}
</style></head>
<body><div class="container">
<div class="card">
<h1>👋 Bonjour ${data.userName}</h1>
<p>Votre révision quotidienne pour <strong>${data.pageTitle}</strong></p>
</div>
<div class="card">
<h2>📖 Extrait</h2>
<div class="highlight"><p>${data.highlight}</p></div>
<h2>❓ Question</h2>
<div class="question"><p>${data.question}</p></div>
<h2>💡 Réponse</h2>
<div class="answer"><p>${data.answer}</p></div>
</div>
<div class="footer">
<a href="${data.unsubscribeUrl}">Se désabonner de ce digest</a>
</div>
</div></body></html>`;
}
