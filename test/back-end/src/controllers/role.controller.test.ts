import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockRequest, createMockResponse } from "../test-utils/expressMocks.js";

vi.mock("../services/role.service.js", () => ({
  roleService: { list: vi.fn() },
}));

const { roleService } = await import("../services/role.service.js");
const { listRoles } = await import("./role.controller.js");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("listRoles", () => {
  it("wraps the service's roles under `roles`", async () => {
    const roles = [{ name: "admin", description: "Full", permissions: ["roles:manage"] }];
    vi.mocked(roleService.list).mockResolvedValue(roles);
    const res = createMockResponse();

    await listRoles(createMockRequest(), res);

    expect(res.json).toHaveBeenCalledWith({ success: true, data: { roles } });
  });
});
