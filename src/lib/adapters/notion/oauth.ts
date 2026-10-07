import { decrypt } from "@/lib/auth/encryption";
import { logWarning } from "@/lib/log";

/**
 * Revoke a user's Notion OAuth token at Notion, using the integration's client
 * credentials (Basic auth) per the OAuth spec. Throws on failure.
 */
export async function revokeNotionToken(token: string): Promise<void> {
  const clientId = process.env.NOTION_CLIENT_ID;
  const clientSecret = process.env.NOTION_CLIENT_SECRET;

  if (!clientId || !clientSecret) return;

  const response = await fetch("https://api.notion.com/v1/oauth/revoke", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Notion token revoke failed: ${response.status} ${body}`);
  }
}

/**
 * Best-effort revocation of a stored (encrypted) token: never throws, so a
 * Notion outage or an already-invalid token can't block local cleanup —
 * clearing the token locally remains the authoritative guarantee.
 */
export async function revokeStoredNotionToken(encryptedToken: string | null): Promise<void> {
  if (!encryptedToken) return;
  try {
    await revokeNotionToken(decrypt(encryptedToken));
  } catch (err) {
    logWarning("Notion token revocation failed (continuing):", err);
  }
}
