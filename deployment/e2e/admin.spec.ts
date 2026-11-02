import { test, expect } from "@playwright/test";

import { loginAs, registerTestUser, seededAdmin, type TestUser } from "./helpers";

// Relies on the initial admin seeded by scripts/e2e-up.sh (SEED_ADMIN_*).

let member: TestUser;

test.beforeAll(async () => {
  member = await registerTestUser("role-target");
});

test.describe("Role assignment", () => {
  test("the seeded admin reaches Users from the account menu and cannot edit their own roles", async ({ page }) => {
    await loginAs(page, seededAdmin);

    await page.getByRole("button", { name: "Account menu" }).click();
    await page.getByRole("menuitem", { name: "Users" }).click();

    await expect(page).toHaveURL(/\/users$/);
    await expect(page.getByRole("heading", { name: "Users" })).toBeVisible();
    await expect(page.getByRole("row", { name: new RegExp(seededAdmin.email) }).getByText("You")).toBeVisible();
  });

  test("granting a role in the UI takes effect for that user without them signing in again", async ({ browser }) => {
    // The member, already signed in, is refused /users.
    const memberContext = await browser.newContext();
    const memberPage = await memberContext.newPage();
    await loginAs(memberPage, member);
    await memberPage.goto("/users");
    await memberPage.waitForURL("**/forbidden");

    // The admin, in a separate session, grants them "manager".
    const adminContext = await browser.newContext();
    const adminPage = await adminContext.newPage();
    await loginAs(adminPage, seededAdmin);
    await adminPage.goto("/users");
    await adminPage.getByRole("button", { name: `Edit roles for ${member.name}` }).click();
    const dialog = adminPage.getByRole("dialog");
    await dialog.getByRole("checkbox", { name: /^manager/i }).check();
    await dialog.getByRole("button", { name: "Save roles" }).click();
    await expect(dialog).not.toBeVisible();
    await expect(adminPage.getByRole("row", { name: new RegExp(member.email) })).toContainText("manager");

    // Same member session — no re-login — now gets in.
    await memberPage.goto("/users");
    await expect(memberPage).toHaveURL(/\/users$/);
    await expect(memberPage.getByRole("heading", { name: "Users" })).toBeVisible();

    await memberContext.close();
    await adminContext.close();
  });
});
