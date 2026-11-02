/**
 * Seed-script configuration (prisma/seed.ts) — the Configuration
 * Platform's (ADR-014) entry point for seeding, separate from env.ts.
 *
 * Seeding runs as a one-off job (locally, in CI, and from deploy.sh
 * against a production image) and needs only the database — not PORT,
 * CORS_ORIGIN, or JWT secrets. Keeping this apart from env.ts means a
 * seed can run with exactly the variables it uses. Deliberately NOT
 * re-exported from config/index.ts, so importing the app's config never
 * pulls this in (and vice versa).
 *
 * Fails fast, like env.ts: a half-configured initial admin (e.g. an
 * email with no password) is a mistake to surface, not skip silently.
 */

import { registerSchema } from "../data-transfer-object/auth.dto.js";

export interface InitialAdminConfig {
  email: string;
  name: string;
  password: string;
  bcryptSaltRounds: number;
}

export interface SeedEnv {
  databaseUrl: string;
  /** null when SEED_ADMIN_EMAIL/SEED_ADMIN_PASSWORD are both unset. */
  initialAdmin: InitialAdminConfig | null;
}

const DEFAULT_ADMIN_NAME = "Administrator";

function configError(message: string): Error {
  return new Error(`[Configuration Error] ${message}`);
}

export function loadSeedEnv(source: NodeJS.ProcessEnv = process.env): SeedEnv {
  const databaseUrl = source["DATABASE_URL"];

  if (!databaseUrl) {
    throw configError("Missing required environment variable: DATABASE_URL");
  }

  const email = source["SEED_ADMIN_EMAIL"];
  const password = source["SEED_ADMIN_PASSWORD"];

  if (!email && !password) {
    return { databaseUrl, initialAdmin: null };
  }

  if (!email || !password) {
    throw configError(
      "SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set together (or both left unset to skip creating an initial admin).",
    );
  }

  // Same rules as self-registration, so a seeded admin can never have a
  // password the app itself would have refused.
  const parsed = registerSchema.safeParse({
    email,
    password,
    name: source["SEED_ADMIN_NAME"] || DEFAULT_ADMIN_NAME,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw configError(`Invalid initial admin (SEED_ADMIN_*): ${issues}`);
  }

  const rawRounds = source["BCRYPT_SALT_ROUNDS"];
  const bcryptSaltRounds = Number(rawRounds);

  if (!rawRounds || !Number.isInteger(bcryptSaltRounds) || bcryptSaltRounds <= 0) {
    throw configError(
      `BCRYPT_SALT_ROUNDS must be a positive integer when SEED_ADMIN_* is set (got "${rawRounds ?? ""}").`,
    );
  }

  return { databaseUrl, initialAdmin: { ...parsed.data, bcryptSaltRounds } };
}
