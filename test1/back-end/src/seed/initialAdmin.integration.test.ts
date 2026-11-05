import bcrypt from "bcrypt";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "../lib/prisma.js";
import { ADMIN_ROLE_NAME, seedInitialAdmin } from "./initialAdmin.js";

const EMAIL_PREFIX = "integration-seed-admin-";

function uniqueEmail(label: string): string {
  return `${EMAIL_PREFIX}${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

function adminConfig(email: string, password = "initial-admin-password") {
  return { email, name: "Seeded Admin", password, bcryptSaltRounds: 4 };
}

async function rolesOf(email: string): Promise<string[]> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { email },
    include: { roles: { include: { role: true } } },
  });
  return user.roles.map((userRole) => userRole.role.name);
}

async function cleanup(): Promise<void> {
  const users = await prisma.user.findMany({ where: { email: { startsWith: EMAIL_PREFIX } }, select: { id: true } });
  const ids = users.map((u) => u.id);
  await prisma.userRole.deleteMany({ where: { userId: { in: ids } } });
  await prisma.user.deleteMany({ where: { id: { in: ids } } });
}

beforeAll(cleanup);

afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});

describe("seedInitialAdmin (real database)", () => {
  it("creates a missing account with the admin role and a bcrypt-hashed password", async () => {
    const email = uniqueEmail("create");

    expect(await seedInitialAdmin(prisma, adminConfig(email))).toBe("created");

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(user.passwordHash).not.toBe("initial-admin-password");
    expect(await bcrypt.compare("initial-admin-password", user.passwordHash)).toBe(true);
    expect(await rolesOf(email)).toEqual([ADMIN_ROLE_NAME]);
  });

  it("is idempotent — a second run changes nothing and never overwrites the password", async () => {
    const email = uniqueEmail("rerun");
    await seedInitialAdmin(prisma, adminConfig(email));
    const before = await prisma.user.findUniqueOrThrow({ where: { email } });

    // Same email, *different* password in the env: must not be applied.
    expect(await seedInitialAdmin(prisma, adminConfig(email, "a-different-password"))).toBe("unchanged");

    const after = await prisma.user.findUniqueOrThrow({ where: { email } });
    expect(after.passwordHash).toBe(before.passwordHash);
    expect(await rolesOf(email)).toEqual([ADMIN_ROLE_NAME]);
  });

  it("promotes an existing non-admin account, keeping its roles and password", async () => {
    const email = uniqueEmail("promote");
    const userRole = await prisma.role.findFirstOrThrow({ where: { name: "user" } });
    const existing = await prisma.user.create({
      data: { email, name: "Existing", passwordHash: "existing-hash", roles: { create: { roleId: userRole.id } } },
    });

    expect(await seedInitialAdmin(prisma, adminConfig(email))).toBe("promoted");

    expect((await rolesOf(email)).sort()).toEqual([ADMIN_ROLE_NAME, "user"]);
    expect((await prisma.user.findUniqueOrThrow({ where: { id: existing.id } })).passwordHash).toBe("existing-hash");
  });

  it("refuses to revive a soft-deleted account under that email", async () => {
    const email = uniqueEmail("deleted");
    await prisma.user.create({ data: { email, name: "Gone", passwordHash: "x", deletedAt: new Date() } });

    await expect(seedInitialAdmin(prisma, adminConfig(email))).rejects.toThrow(/belongs to a deleted account/);
    expect(await rolesOf(email)).toEqual([]);
  });
});
