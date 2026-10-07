import { expect, test, type Page } from "@playwright/test";

/**
 * Collect uncaught client-side errors (e.g. React hydration crashes) and
 * Content-Security-Policy violations (a too-strict CSP silently breaks pages).
 */
function trackClientErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
  page.on("console", (msg) => {
    if (msg.type() === "error" && /Content Security Policy/i.test(msg.text())) {
      errors.push(msg.text());
    }
  });
  return errors;
}

test.describe("public pages", () => {
  test("home page renders and hydrates without client errors", async ({ page }) => {
    const errors = trackClientErrors(page);

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Application error")).toHaveCount(0);
    await expect(page.getByRole("heading", { level: 1, name: "NotionTutor" })).toBeVisible();
    await expect(page.getByRole("link", { name: /Se connecter avec Notion/ })).toHaveAttribute(
      "href",
      "/api/auth/notion"
    );
    await expect(page.getByText("Votre session a expiré")).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("session-expired banner shows only with ?error=session_expired", async ({ page }) => {
    const errors = trackClientErrors(page);

    await page.goto("/?error=session_expired");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Votre session a expiré")).toBeVisible();
    await expect(page.getByText("Application error")).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("security page renders", async ({ page }) => {
    const errors = trackClientErrors(page);

    const res = await page.goto("/security");

    expect(res?.status()).toBe(200);
    await expect(page.getByText("Application error")).toHaveCount(0);
    // Users must be told their note content is sent to OpenAI (RGPD transparency).
    await expect(page.getByRole("heading", { name: /Génération par IA/ })).toBeVisible();
    expect(errors).toEqual([]);
  });
});

test.describe("auth guard", () => {
  for (const path of ["/dashboard", "/dashboard/profile", "/dashboard/digests"]) {
    test(`${path} redirects anonymous visitors to the home page`, async ({ page }) => {
      await page.goto(path);
      await expect(page).toHaveURL(/\/$/);
    });
  }

  test("protected API returns 401 without a session", async ({ request }) => {
    const res = await request.get("/api/auth/me");
    expect(res.status()).toBe(401);
  });
});

test("favicon and apple touch icon are declared and served", async ({ page, request }) => {
  await page.goto("/");

  for (const rel of ["icon", "apple-touch-icon"]) {
    const href = await page.locator(`head link[rel="${rel}"]`).first().getAttribute("href");
    expect(href, `<link rel="${rel}">`).toBeTruthy();
    const res = await request.get(href!);
    expect(res.status(), href!).toBe(200);
  }
});

test.describe("security hardening", () => {
  test("security headers are served and the framework isn't advertised", async ({ request }) => {
    for (const path of ["/", "/api/health"]) {
      const headers = (await request.get(path)).headers();
      expect(headers["content-security-policy"], path).toContain("frame-ancestors 'none'");
      expect(headers["content-security-policy"], path).not.toContain("unsafe-eval");
      expect(headers["x-frame-options"], path).toBe("DENY");
      expect(headers["x-content-type-options"], path).toBe("nosniff");
      expect(headers["referrer-policy"], path).toBe("strict-origin-when-cross-origin");
      expect(headers["strict-transport-security"], path).toContain("max-age=");
      expect(headers["x-powered-by"], path).toBeUndefined();
    }
  });

  test("image optimizer refuses remote URLs", async ({ request }) => {
    const url = encodeURIComponent("https://www.notion.so/images/favicon.ico");
    const res = await request.get(`/_next/image?url=${url}&w=64&q=75`);
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test("nested paths with a dot are not served anonymously", async ({ page }) => {
    await page.goto("/dashboard/revise/x.png");
    await expect(page).toHaveURL(/\/$/);
  });
});

test("health endpoint responds", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  expect((await res.json()).status).toBe("ok");
});
