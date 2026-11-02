import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PrismaClient } from "../../generated/prisma/client.js";
import { seedInitialAdmin } from "./initialAdmin.js";

// Unit-level: branch logic against a fake client. The real-database
// behaviour (hashing, nested create, idempotency) is proven in
// initialAdmin.integration.test.ts.
const client = {
  role: { findFirst: vi.fn() },
  user: { findUnique: vi.fn(), create: vi.fn() },
  userRole: { create: vi.fn() },
};
const prisma = client as unknown as PrismaClient;

const admin = { email: "admin@example.com", name: "Admin", password: "a-long-enough-password", bcryptSaltRounds: 4 };
const ADMIN_ROLE = { id: "role-admin", name: "admin" };

beforeEach(() => {
  vi.clearAllMocks();
  client.role.findFirst.mockResolvedValue(ADMIN_ROLE);
});

describe("seedInitialAdmin", () => {
  it("fails clearly when the admin role hasn't been seeded yet", async () => {
    client.role.findFirst.mockResolvedValue(null);

    await expect(seedInitialAdmin(prisma, admin)).rejects.toThrow(/Role "admin" is missing/);
    expect(client.user.create).not.toHaveBeenCalled();
  });

  it("creates the user with the admin role in a single nested write", async () => {
    client.user.findUnique.mockResolvedValue(null);

    await expect(seedInitialAdmin(prisma, admin)).resolves.toBe("created");

    const { data } = client.user.create.mock.calls[0][0];
    expect(data).toMatchObject({ email: admin.email, name: admin.name, roles: { create: { roleId: ADMIN_ROLE.id } } });
    expect(data.passwordHash).toMatch(/^\$2[aby]\$04\$/);
  });

  it("grants the role to an existing non-admin without touching the user row", async () => {
    client.user.findUnique.mockResolvedValue({ id: "u1", deletedAt: null, roles: [{ roleId: "role-user" }] });

    await expect(seedInitialAdmin(prisma, admin)).resolves.toBe("promoted");

    expect(client.userRole.create).toHaveBeenCalledWith({ data: { userId: "u1", roleId: ADMIN_ROLE.id } });
    expect(client.user.create).not.toHaveBeenCalled();
  });

  it("does nothing for an existing admin", async () => {
    client.user.findUnique.mockResolvedValue({ id: "u1", deletedAt: null, roles: [{ roleId: ADMIN_ROLE.id }] });

    await expect(seedInitialAdmin(prisma, admin)).resolves.toBe("unchanged");

    expect(client.userRole.create).not.toHaveBeenCalled();
    expect(client.user.create).not.toHaveBeenCalled();
  });

  it("refuses a soft-deleted account", async () => {
    client.user.findUnique.mockResolvedValue({ id: "u1", deletedAt: new Date(), roles: [] });

    await expect(seedInitialAdmin(prisma, admin)).rejects.toThrow(/belongs to a deleted account/);
  });
});
