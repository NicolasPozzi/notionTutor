import { CircuitBreaker } from "@/lib/adapters/llm/circuit-breaker";

import type { NotionPage, NotionPageContent, NotionPagesResult } from "./types";

const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";
const MAX_RETRIES = 3;
const PAGE_SIZE = 100;

const circuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeoutMs: 60_000,
});

async function notionFetch(
  path: string,
  token: string,
  options: RequestInit = {}
): Promise<Response> {
  return circuitBreaker.execute(async () => {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const response = await fetch(`${NOTION_API}${path}`, {
        ...options,
        headers: {
          Authorization: `Bearer ${token}`,
          "Notion-Version": NOTION_VERSION,
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      if (response.ok) return response;

      // Rate limited - exponential backoff
      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : Math.pow(2, attempt) * 1000;
        await sleep(waitMs);
        continue;
      }

      // Server error - retry
      if (response.status >= 500) {
        lastError = new Error(`Notion API error: ${response.status}`);
        await sleep(Math.pow(2, attempt) * 1000);
        continue;
      }

      // Client error - don't retry
      const body = await response.text();
      throw new Error(`Notion API ${response.status}: ${body}`);
    }

    throw lastError ?? new Error("Notion API: max retries exceeded");
  });
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Search for accessible pages in the user's workspace.
 */
export async function searchPages(
  token: string,
  cursor?: string | null
): Promise<NotionPagesResult> {
  const response = await notionFetch("/search", token, {
    method: "POST",
    body: JSON.stringify({
      filter: { value: "page", property: "object" },
      sort: { direction: "descending", timestamp: "last_edited_time" },
      page_size: PAGE_SIZE,
      ...(cursor ? { start_cursor: cursor } : {}),
    }),
  });

  const data = await response.json();

  const pages: NotionPage[] = (data.results ?? []).map((page: Record<string, unknown>) => ({
    id: page.id as string,
    title: extractTitle(page),
    icon: extractIcon(page),
    lastEditedAt: page.last_edited_time as string,
    url: page.url as string,
  }));

  return {
    pages,
    hasMore: data.has_more ?? false,
    nextCursor: data.next_cursor ?? null,
  };
}

/**
 * Get page content as plain text (ephemeral - not stored).
 */
export async function getPageContent(token: string, pageId: string): Promise<NotionPageContent> {
  // Fetch page metadata
  const pageRes = await notionFetch(`/pages/${pageId}`, token);
  const pageData = await pageRes.json();
  const title = extractTitle(pageData);

  // Fetch blocks (content)
  const blocksRes = await notionFetch(`/blocks/${pageId}/children?page_size=100`, token);
  const blocksData = await blocksRes.json();

  const content = extractTextFromBlocks(blocksData.results ?? []);

  return { pageId, title, content };
}

// ─── Helpers ───────────────────────────────────────────────

function extractTitle(page: Record<string, unknown>): string {
  const properties = page.properties as Record<string, unknown> | undefined;
  if (!properties) return "Sans titre";

  // Find the title property
  for (const prop of Object.values(properties)) {
    const p = prop as Record<string, unknown>;
    if (p.type === "title") {
      const titleArr = p.title as Array<{ plain_text: string }> | undefined;
      if (titleArr && titleArr.length > 0) {
        return titleArr.map((t) => t.plain_text).join("");
      }
    }
  }

  return "Sans titre";
}

function extractIcon(page: Record<string, unknown>): string | null {
  const icon = page.icon as Record<string, unknown> | null;
  if (!icon) return null;

  if (icon.type === "emoji") return icon.emoji as string;
  if (icon.type === "external") return (icon.external as Record<string, string>)?.url ?? null;

  return null;
}

function extractTextFromBlocks(blocks: Array<Record<string, unknown>>): string {
  const texts: string[] = [];

  for (const block of blocks) {
    const type = block.type as string;
    const content = block[type] as Record<string, unknown> | undefined;
    if (!content) continue;

    const richText = content.rich_text as Array<{ plain_text: string }> | undefined;
    if (richText && richText.length > 0) {
      texts.push(richText.map((t) => t.plain_text).join(""));
    }
  }

  return texts.join("\n");
}
