import bcrypt from "bcrypt";

import type { PrismaClient } from "../../generated/prisma/client.js";
import type { InitialAdminConfig } from "../config/seedEnv.js";

export const ADMIN_ROLE_NAME = "admin";

export type InitialAdminOutcome = "created" | "promoted" | "unchanged";

/**
 * Ensures the account named by SEED_ADMIN_EMAIL exists and holds the
 * admin role — the bootstrap path for a fresh install, where nobody can
 * grant roles yet because nobody is an admin yet.
 *
 * Idempotent and deliberately conservative, since deploy.sh re-runs the
 * seed on every deploy:
 * - never overwrites an existing account's password (re-deploying must
 *   not reset a password the admin has since changed), and
 * - never revives a soft-deleted account under that email.
 *
 * Runs after roles are seeded — the admin role must already exist.
 * Takes the client as a parameter (rather than importing lib/prisma.ts)
 * so the seed can run without the HTTP server's config, see seedEnv.ts.
 */
export async function seedInitialAdmin(prisma: PrismaClient, admin: InitialAdminConfig): Promise<InitialAdminOutcome> {
  const adminRole = await prisma.role.findFirst({ where: { name: ADMIN_ROLE_NAME, deletedAt: null } });

  if (!adminRole) {
    throw new Error(`Role "${ADMIN_ROLE_NAME}" is missing — seed roles before the initial admin.`);
  }

  // findUnique (not findFirst with deletedAt: null) on purpose: email is
  // unique across soft-deleted rows too, so a deleted account would
  // otherwise make the create below fail with an opaque constraint error.
  const existing = await prisma.user.findUnique({
    where: { email: admin.email },
    include: { roles: true },
  });

  if (existing?.deletedAt) {
    throw new Error(
      `SEED_ADMIN_EMAIL ${admin.email} belongs to a deleted account; choose a different email rather than reviving it.`,
    );
  }

  if (existing) {
    if (existing.roles.some((userRole) => userRole.roleId === adminRole.id)) {
      return "unchanged";
    }

    await prisma.userRole.create({ data: { userId: existing.id, roleId: adminRole.id } });
    return "promoted";
  }

  const passwordHash = await bcrypt.hash(admin.password, admin.bcryptSaltRounds);

  await prisma.user.create({
    data: {
      email: admin.email,
      name: admin.name,
      passwordHash,
      roles: { create: { roleId: adminRole.id } },
    },
  });

  return "created";
}
