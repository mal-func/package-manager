import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../repositories/role.repository.js", () => ({
  roleRepository: { findAll: vi.fn() },
}));

const { roleRepository } = await import("../repositories/role.repository.js");
const { roleService } = await import("./role.service.js");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("roleService.list", () => {
  it("flattens each role's permission joins into plain permission keys", async () => {
    vi.mocked(roleRepository.findAll).mockResolvedValue([
      {
        id: "r1",
        name: "manager",
        description: "Can view user accounts",
        permissions: [{ permission: { key: "users:read" } }],
      },
    ] as never);

    await expect(roleService.list()).resolves.toEqual([
      { name: "manager", description: "Can view user accounts", permissions: ["users:read"] },
    ]);
  });
});
