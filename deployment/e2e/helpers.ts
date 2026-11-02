import type { Page } from "@playwright/test";

// The reverse proxy fronts both containers on one origin — /api/* is
// proxied straight to the backend (see reverse-proxy/apache/httpd.conf).
// There's no separate backend port to reach directly anymore.
const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:8080";
const API_URL = `${BASE_URL}/api/v1`;

export interface TestUser {
  email: string;
  password: string;
  name: string;
}

/**
 * The initial admin that scripts/e2e-up.sh seeds (SEED_ADMIN_* in
 * compose/.env). Override both when pointing the suite at another
 * environment via E2E_BASE_URL.
 */
export const seededAdmin: TestUser = {
  email: process.env.E2E_ADMIN_EMAIL ?? "e2e-admin@example.com",
  password: process.env.E2E_ADMIN_PASSWORD ?? "e2e-admin-password",
  name: "Administrator",
};

/** A unique, never-before-used email for this run. */
export function uniqueEmail(label: string): string {
  return `e2e-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

/**
 * Registers a fresh user directly against the backend API (fast setup —
 * the Register *page* itself is covered in auth.spec.ts) so each test
 * run starts from a known, unique account instead of depending on
 * seeded fixture data.
 */
export async function registerTestUser(label: string): Promise<TestUser> {
  const email = uniqueEmail(label);
  const user: TestUser = { email, password: "correct-horse-battery-staple", name: `E2E ${label}` };

  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });

  if (!response.ok) {
    throw new Error(`Failed to register test user: ${String(response.status)} ${await response.text()}`);
  }

  return user;
}

/** Logs in through the real UI form and waits for the redirect to land on the dashboard. */
export async function loginAs(page: Page, user: TestUser): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Email address").fill(user.email);
  await page.getByLabel("Password", { exact: true }).fill(user.password);
  await page.getByRole("button", { name: "Sign In" }).click();
  await page.waitForURL("**/dashboard");
}
