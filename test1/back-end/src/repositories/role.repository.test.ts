import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    role: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

const { prisma } = await import("../lib/prisma.js");
const { roleRepository } = await import("./role.repository.js");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("roleRepository.findByName", () => {
  it("filters by name and excludes soft-deleted roles", async () => {
    vi.mocked(prisma.role.findFirst).mockResolvedValue({ id: "r1", name: "admin" } as never);

    const result = await roleRepository.findByName("admin");

    expect(prisma.role.findFirst).toHaveBeenCalledWith({ where: { name: "admin", deletedAt: null } });
    expect(result).toEqual({ id: "r1", name: "admin" });
  });

  it("returns null when no role matches", async () => {
    vi.mocked(prisma.role.findFirst).mockResolvedValue(null);

    await expect(roleRepository.findByName("nonexistent")).resolves.toBeNull();
  });
});

describe("roleRepository.findByNames", () => {
  it("looks up every given name at once, excluding soft-deleted roles", async () => {
    vi.mocked(prisma.role.findMany).mockResolvedValue([]);

    await roleRepository.findByNames(["admin", "manager"]);

    expect(prisma.role.findMany).toHaveBeenCalledWith({
      where: { name: { in: ["admin", "manager"] }, deletedAt: null },
    });
  });
});

describe("roleRepository.findAll", () => {
  it("returns live roles with their permissions, alphabetically", async () => {
    vi.mocked(prisma.role.findMany).mockResolvedValue([]);

    await roleRepository.findAll();

    expect(prisma.role.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
      include: { permissions: { include: { permission: true } } },
      orderBy: { name: "asc" },
    });
  });
});
