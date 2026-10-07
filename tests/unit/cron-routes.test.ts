import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET as cleanup } from "@/app/api/cron/cleanup/route";
import { GET as sendDigests } from "@/app/api/cron/send-digests/route";
import { decryptField, encrypt, encryptField, isEncryptedField } from "@/lib/auth/encryption";

// vi.mock() calls below are hoisted above these imports by Vitest.

const { prisma, getPageContent, sendEmail } = vi.hoisted(() => ({
  prisma: {
    digest: { findMany: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
    revisionSession: { updateMany: vi.fn() },
    question: { findMany: vi.fn(), update: vi.fn() },
  },
  getPageContent: vi.fn(),
  sendEmail: vi.fn(),
}));

vi.mock("@/lib/db", () => ({ prisma }));
vi.mock("@/lib/adapters/notion", () => ({ getPageContent }));
vi.mock("@/lib/adapters/llm", () => ({
  getQuestionGenerator: () => ({
    generateQuestions: async () => ({
      questions: [{ question: "Que fait <script>alert(1)</script> ?", answerExcerpt: "A & B" }],
    }),
  }),
}));
vi.mock("resend", () => ({
  Resend: class {
    emails = { send: sendEmail };
  },
}));

const cronRequest = (secret = "test-cron-secret") =>
  new Request("http://localhost/api/cron", { headers: { authorization: `Bearer ${secret}` } });

const DAY = 24 * 3_600_000;
const digest = (overrides: Record<string, unknown>) => ({
  id: "d1",
  notionPageId: "page-1",
  notionPageTitle: "Mes <notes>",
  frequency: "daily",
  lastSentAt: null,
  unsubscribeToken: "unsub",
  user: { email: "a@b.c", name: "Nico", notionToken: encrypt("ntn_secret") },
  ...overrides,
});

beforeEach(() => {
  vi.resetAllMocks();
  getPageContent.mockResolvedValue({ pageId: "page-1", title: "Notes", content: "x < y & z" });
  sendEmail.mockResolvedValue({ id: "email-1" });
  prisma.digest.updateMany.mockResolvedValue({ count: 0 });
  prisma.revisionSession.updateMany.mockResolvedValue({ count: 0 });
  prisma.question.findMany.mockResolvedValue([]);
});

describe("cron authorization", () => {
  it.each([
    ["send-digests", sendDigests],
    ["cleanup", cleanup],
  ])("%s fails closed when CRON_SECRET is not configured", async (_name, handler) => {
    const secret = process.env.CRON_SECRET;
    delete process.env.CRON_SECRET;
    try {
      // Before the fix, this exact header matched `Bearer ${undefined}`.
      expect((await handler(cronRequest("undefined"))).status).toBe(401);
      expect((await handler(new Request("http://localhost/api/cron"))).status).toBe(401);
    } finally {
      process.env.CRON_SECRET = secret;
    }
    expect(prisma.digest.findMany).not.toHaveBeenCalled();
    expect(prisma.digest.updateMany).not.toHaveBeenCalled();
  });

  it("rejects a secret of the wrong length or value", async () => {
    expect((await sendDigests(cronRequest("test-cron-secret-x"))).status).toBe(401);
    expect((await sendDigests(cronRequest("test-cron-secreT"))).status).toBe(401);
  });
});

describe("GET /api/cron/send-digests", () => {
  it("rejects calls without the cron secret", async () => {
    expect((await sendDigests(cronRequest("wrong"))).status).toBe(401);
    expect(prisma.digest.findMany).not.toHaveBeenCalled();
  });

  it("sends only due digests: weekly sent yesterday is skipped (regression)", async () => {
    const now = Date.now();
    prisma.digest.findMany.mockResolvedValue([
      digest({ id: "daily-due", frequency: "daily", lastSentAt: new Date(now - DAY) }),
      digest({ id: "weekly-not-due", frequency: "weekly", lastSentAt: new Date(now - DAY) }),
      digest({ id: "weekly-due", frequency: "weekly", lastSentAt: new Date(now - 7 * DAY) }),
    ]);

    const body = await (await sendDigests(cronRequest())).json();

    expect(body).toMatchObject({ sent: 2, errors: 0, total: 2 });
    const updated = prisma.digest.update.mock.calls.map(([arg]) => arg.where.id);
    expect(updated).toEqual(["daily-due", "weekly-due"]);
  });

  it("escapes Notion and AI text in the email HTML", async () => {
    prisma.digest.findMany.mockResolvedValue([digest({})]);

    await sendDigests(cronRequest());

    const { html, to } = sendEmail.mock.calls[0]![0];
    expect(to).toBe("a@b.c");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt;");
    expect(html).toContain("Mes &lt;notes&gt;");
    expect(html).toContain("x &lt; y &amp; z");
  });

  it("skips users without email or with Notion disconnected", async () => {
    prisma.digest.findMany.mockResolvedValue([
      digest({ id: "no-email", user: { email: null, name: null, notionToken: encrypt("t") } }),
      digest({ id: "disconnected", user: { email: "a@b.c", name: null, notionToken: null } }),
    ]);

    await sendDigests(cronRequest());

    expect(sendEmail).not.toHaveBeenCalled();
    expect(prisma.digest.update).not.toHaveBeenCalled();
  });
});

describe("GET /api/cron/cleanup", () => {
  it("rejects calls without the cron secret", async () => {
    expect((await cleanup(cronRequest("wrong"))).status).toBe(401);
  });

  it("encrypts legacy plaintext questions and leaves encrypted excerpts alone", async () => {
    const alreadyEncrypted = encryptField("déjà chiffré");
    prisma.question.findMany.mockResolvedValue([
      { id: "q1", questionText: "Ancienne question ?", answerExcerpt: "Ancien extrait" },
      { id: "q2", questionText: "Sans extrait ?", answerExcerpt: null },
      { id: "q3", questionText: "Mixte ?", answerExcerpt: alreadyEncrypted },
    ]);

    const body = await (await cleanup(cronRequest())).json();

    expect(body.encryptedQuestions).toBe(3);
    const where = prisma.question.findMany.mock.calls[0]![0].where;
    expect(where).toEqual({ NOT: { questionText: { startsWith: "enc:v1:" } } });

    const updates = Object.fromEntries(
      prisma.question.update.mock.calls.map(([arg]) => [arg.where.id, arg.data])
    );
    expect(isEncryptedField(updates.q1.questionText)).toBe(true);
    expect(decryptField(updates.q1.answerExcerpt)).toBe("Ancien extrait");
    expect(updates.q2.answerExcerpt).toBeNull();
    expect(updates.q3.answerExcerpt).toBe(alreadyEncrypted);
  });
});
