import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    userRole: {
      create: vi.fn(),
      deleteMany: vi.fn().mockReturnValue("delete-op"),
      createMany: vi.fn().mockReturnValue("create-op"),
    },
    $transaction: vi.fn(),
  },
}));

const { prisma } = await import("../lib/prisma.js");
const { userRepository } = await import("./user.repository.js");

const rolesInclude = { roles: { include: { role: { include: { permissions: { include: { permission: true } } } } } } };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("userRepository.findAll", () => {
  it("queries non-deleted users, newest first, with roles/permissions included, bounded by limit/offset", async () => {
    vi.mocked(prisma.user.findMany).mockResolvedValue([{ id: "u1" }] as never);

    const result = await userRepository.findAll({ limit: 20, offset: 40 });

    expect(prisma.user.findMany).toHaveBeenCalledWith({
      where: { deletedAt: null },
      include: rolesInclude,
      orderBy: { createdAt: "desc" },
      take: 20,
      skip: 40,
    });
    expect(result).toEqual([{ id: "u1" }]);
  });
});

describe("userRepository.count", () => {
  it("counts non-deleted users", async () => {
    vi.mocked(prisma.user.count).mockResolvedValue(42);

    const result = await userRepository.count();

    expect(prisma.user.count).toHaveBeenCalledWith({ where: { deletedAt: null } });
    expect(result).toBe(42);
  });
});

describe("userRepository.findByEmail", () => {
  it("filters by email and excludes soft-deleted users", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: "u1", email: "a@b.com" } as never);

    const result = await userRepository.findByEmail("a@b.com");

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { email: "a@b.com", deletedAt: null },
      include: rolesInclude,
    });
    expect(result).toEqual({ id: "u1", email: "a@b.com" });
  });

  it("returns null when no user matches (pass-through, no swallowing)", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue(null);

    await expect(userRepository.findByEmail("nobody@example.com")).resolves.toBeNull();
  });
});

describe("userRepository.findById", () => {
  it("filters by id and excludes soft-deleted users", async () => {
    vi.mocked(prisma.user.findFirst).mockResolvedValue({ id: "u1" } as never);

    await userRepository.findById("u1");

    expect(prisma.user.findFirst).toHaveBeenCalledWith({
      where: { id: "u1", deletedAt: null },
      include: rolesInclude,
    });
  });
});

describe("userRepository.create", () => {
  it("passes the input straight through as the create data", async () => {
    const input = { email: "new@example.com", name: "New User", passwordHash: "hashed" };
    vi.mocked(prisma.user.create).mockResolvedValue({ id: "u2", ...input } as never);

    const result = await userRepository.create(input);

    expect(prisma.user.create).toHaveBeenCalledWith({ data: input });
    expect(result).toMatchObject(input);
  });
});

describe("userRepository.assignRole", () => {
  it("creates a UserRole join row for the given user and role", async () => {
    vi.mocked(prisma.userRole.create).mockResolvedValue({ userId: "u1", roleId: "r1" } as never);

    await userRepository.assignRole("u1", "r1");

    expect(prisma.userRole.create).toHaveBeenCalledWith({ data: { userId: "u1", roleId: "r1" } });
  });
});

describe("userRepository.recordFailedLogin", () => {
  it("updates the attempt count and lockout expiry for the given user", async () => {
    const lockedUntil = new Date("2026-01-01T00:00:00Z");
    vi.mocked(prisma.user.update).mockResolvedValue({} as never);

    await userRepository.recordFailedLogin("u1", 3, lockedUntil);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { failedLoginAttempts: 3, lockedUntil },
    });
  });

  it("accepts a null lockedUntil (not yet locked)", async () => {
    vi.mocked(prisma.user.update).mockResolvedValue({} as never);

    await userRepository.recordFailedLogin("u1", 1, null);

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { failedLoginAttempts: 1, lockedUntil: null },
    });
  });
});

describe("userRepository.resetFailedLogins", () => {
  it("zeroes the attempt count and clears the lockout for the given user", async () => {
    vi.mocked(prisma.user.update).mockResolvedValue({} as never);

    await userRepository.resetFailedLogins("u1");

    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "u1" },
      data: { failedLoginAttempts: 0, lockedUntil: null },
    });
  });
});

describe("userRepository.replaceRoles", () => {
  it("deletes the old roles and creates the new ones in one transaction", async () => {
    await userRepository.replaceRoles("u1", ["r1", "r2"]);

    expect(prisma.userRole.deleteMany).toHaveBeenCalledWith({ where: { userId: "u1" } });
    expect(prisma.userRole.createMany).toHaveBeenCalledWith({
      data: [
        { userId: "u1", roleId: "r1" },
        { userId: "u1", roleId: "r2" },
      ],
    });
    // Both operations handed to a single $transaction, delete first.
    expect(prisma.$transaction).toHaveBeenCalledWith(["delete-op", "create-op"]);
  });
});
