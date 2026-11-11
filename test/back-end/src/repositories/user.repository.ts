import type { PrismaClient } from "../../generated/prisma/client.js";
import { prisma } from "../lib/prisma.js";

export interface CreateUserInput {
  email: string;
  name: string;
  passwordHash: string;
}

/**
 * All direct Prisma access for the User model. No auth/business rules
 * here — just persistence. Roles/permissions are always included since
 * every caller that loads a user needs them for authorization checks.
 */
export const userRepository = {
  findAll({ limit, offset }: { limit: number; offset: number }) {
    return prisma.user.findMany({
      where: { deletedAt: null },
      include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    });
  },

  count() {
    return prisma.user.count({ where: { deletedAt: null } });
  },

  findByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email, deletedAt: null },
      include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
    });
  },

  findById(id: string) {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } },
    });
  },

  // `client` defaults to the module-level `prisma` singleton but accepts
  // a transaction's `tx` too (only typed for the one delegate each
  // function actually touches, so both the singleton and `tx` satisfy
  // it structurally) -- lets authService.register() run create() +
  // assignRole() atomically via prisma.$transaction(async (tx) => ...),
  // without every other caller needing to know transactions exist.
  create(input: CreateUserInput, client: Pick<PrismaClient, "user"> = prisma) {
    return client.user.create({
      data: input,
    });
  },

  assignRole(userId: string, roleId: string, client: Pick<PrismaClient, "userRole"> = prisma) {
    return client.userRole.create({
      data: { userId, roleId },
    });
  },

  /**
   * Makes `roleIds` the user's complete set of roles, atomically — a
   * failure between the delete and the create can't leave the user with
   * no roles (which would look like a revoked account).
   */
  replaceRoles(userId: string, roleIds: string[]) {
    return prisma.$transaction([
      prisma.userRole.deleteMany({ where: { userId } }),
      prisma.userRole.createMany({ data: roleIds.map((roleId) => ({ userId, roleId })) }),
    ]);
  },

  recordFailedLogin(userId: string, failedLoginAttempts: number, lockedUntil: Date | null) {
    return prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts, lockedUntil },
    });
  },

  resetFailedLogins(userId: string) {
    return prisma.user.update({
      where: { id: userId },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  },
};
