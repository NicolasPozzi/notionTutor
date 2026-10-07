import { expect, test, type Page } from "@playwright/test";

/** Collect uncaught client-side errors (e.g. React hydration crashes). */
function trackClientErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));
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

test("health endpoint responds", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  expect((await res.json()).status).toBe("ok");
});
