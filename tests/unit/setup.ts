import crypto from "node:crypto";

// Deterministic test environment: real crypto, fake secrets, no network.
process.env.ENCRYPTION_KEY = crypto.randomBytes(32).toString("base64");
process.env.SESSION_SECRET = "test-session-secret";
process.env.CRON_SECRET = "test-cron-secret";
process.env.RESEND_API_KEY = "re_test";
process.env.NOTION_CLIENT_ID = "notion-client-id";
process.env.NOTION_CLIENT_SECRET = "notion-client-secret";
process.env.MOCK_LLM = "true";
