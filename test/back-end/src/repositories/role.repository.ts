import { prisma } from "../lib/prisma.js";

export const roleRepository = {
  findByName(name: string) {
    return prisma.role.findFirst({ where: { name, deletedAt: null } });
  },

  findByNames(names: string[]) {
    return prisma.role.findMany({ where: { name: { in: names }, deletedAt: null } });
  },

  findAll() {
    return prisma.role.findMany({
      where: { deletedAt: null },
      include: { permissions: { include: { permission: true } } },
      orderBy: { name: "asc" },
    });
  },
};
