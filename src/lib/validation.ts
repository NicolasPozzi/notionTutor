import { NextResponse } from "next/server";
import { z } from "zod";

// ─── Identifiers ───────────────────────────────────────────

/** Our own primary keys (Postgres uuid). Invalid values made Prisma throw → 500. */
export const uuid = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "Identifiant invalide");

/**
 * Notion page ID (UUID, with or without dashes). Strict on purpose: the ID is
 * inserted into Notion API paths, and a value like `../users` would otherwise
 * reach other Notion endpoints with the user's integration token.
 */
export const notionPageId = z
  .string()
  .regex(
    /^[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}$/i,
    "Identifiant de page Notion invalide"
  );

/** Digest unsubscribe token: 32 random bytes, hex-encoded. */
export const unsubscribeToken = z.string().regex(/^[0-9a-f]{64}$/, "Lien invalide");

// ─── Request bodies & queries ──────────────────────────────

export const startRevisionSchema = z.object({ notionPageId });

export const answerSchema = z.object({
  questionId: uuid,
  isCorrect: z.boolean(),
});

const frequency = z.enum(["daily", "weekly"]);
const sendTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Heure invalide (HH:MM)");
const durationDays = z.number().int().min(1).max(365).nullable();

export const createDigestSchema = z.object({
  notionPageId,
  // Notion titles can be long: truncate to the column size instead of failing.
  notionPageTitle: z
    .string()
    .max(10_000)
    .transform((title) => title.slice(0, 500))
    .optional(),
  frequency: frequency.optional(),
  sendTime: sendTime.optional(),
  durationDays: durationDays.optional(),
});

export const updateDigestSchema = z.object({
  frequency: frequency.optional(),
  sendTime: sendTime.optional(),
  durationDays: durationDays.optional(),
  status: z.enum(["active", "paused", "completed"]).optional(),
});

export const historyQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).max(100_000).default(0),
});

// ─── Helpers ───────────────────────────────────────────────

type Parsed<T> = { ok: true; data: T } | { ok: false; response: NextResponse };

function invalid(error: z.ZodError): NextResponse {
  return NextResponse.json(
    {
      error: "Requête invalide",
      details: error.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
      })),
    },
    { status: 400 }
  );
}

/** Validate any value (route params, query) against a schema. */
export function parse<S extends z.ZodType>(schema: S, value: unknown): Parsed<z.output<S>> {
  const result = schema.safeParse(value);
  return result.success
    ? { ok: true, data: result.data }
    : { ok: false, response: invalid(result.error) };
}

/** Read and validate a JSON request body. Malformed JSON → 400 instead of 500. */
export async function parseJsonBody<S extends z.ZodType>(
  request: Request,
  schema: S
): Promise<Parsed<z.output<S>>> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: "Corps de requête JSON invalide" }, { status: 400 }),
    };
  }
  return parse(schema, body);
}
