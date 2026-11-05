/**
 * `npm run db:test:prepare` — brings the integration-test database up
 * to date: applies every migration, then seeds roles/permissions (the
 * integration tests look up the seeded "admin"/"user" roles).
 *
 * Always targets TEST_DATABASE_URL, whatever DATABASE_URL your .env
 * says, and never creates a seed admin there even if SEED_ADMIN_* is
 * set locally. Safe to re-run; both steps are idempotent.
 */
import { execFileSync } from "node:child_process";

import { TEST_DATABASE_URL } from "../src/test-utils/testDatabase.js";

// Explicitly set (even to "") so prisma.config.ts's dotenv, which never
// overrides a variable that's already present, can't fill these in
// from a developer's local .env.
const env = { ...process.env, DATABASE_URL: TEST_DATABASE_URL, SEED_ADMIN_EMAIL: "", SEED_ADMIN_PASSWORD: "" };

for (const args of [
  ["prisma", "migrate", "deploy"],
  ["prisma", "db", "seed"],
]) {
  execFileSync("npx", args, { stdio: "inherit", env, shell: process.platform === "win32" });
}
