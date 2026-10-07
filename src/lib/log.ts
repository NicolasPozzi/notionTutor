const MAX_MESSAGE_LENGTH = 300;

/**
 * Log an error without dumping data. Prisma errors print the full query
 * arguments (emails, question text…) after their first line, and raw `err`
 * objects can carry request/response bodies: keep the name, code, HTTP status
 * and the first line of the message only.
 */
export function logError(context: string, error: unknown): void {
  console.error(context, summarizeError(error));
}

export function logWarning(context: string, error: unknown): void {
  console.warn(context, summarizeError(error));
}

export function summarizeError(error: unknown): string {
  if (!(error instanceof Error)) return String(error).slice(0, MAX_MESSAGE_LENGTH);

  const { code, status } = error as Error & { code?: unknown; status?: unknown };
  const firstLine = (error.message.split("\n").find((line) => line.trim()) ?? "").trim();

  return [
    error.name,
    typeof code === "string" ? `code=${code}` : null,
    typeof status === "number" ? `status=${status}` : null,
    firstLine.slice(0, MAX_MESSAGE_LENGTH),
  ]
    .filter(Boolean)
    .join(" ");
}
