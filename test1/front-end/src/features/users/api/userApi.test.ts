import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/api", () => ({ apiClient: { get: vi.fn(), put: vi.fn() } }));

const { apiClient } = await import("@/api");
const { userApi } = await import("./userApi");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("userApi.list", () => {
  it("gets /users with limit/offset as query params", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ users: [], pagination: { limit: 20, offset: 0, total: 0 } });

    await userApi.list({ limit: 20, offset: 40 });

    expect(apiClient.get).toHaveBeenCalledWith("/users", { limit: 20, offset: 40 });
  });
});

describe("userApi.listRoles", () => {
  it("gets /roles", async () => {
    vi.mocked(apiClient.get).mockResolvedValue({ roles: [] });

    await userApi.listRoles();

    expect(apiClient.get).toHaveBeenCalledWith("/roles");
  });
});

describe("userApi.setRoles", () => {
  it("puts the full role list to /users/:id/roles, URL-encoding the id", async () => {
    vi.mocked(apiClient.put).mockResolvedValue({ user: {} });

    await userApi.setRoles("a/b", ["manager"]);

    expect(apiClient.put).toHaveBeenCalledWith("/users/a%2Fb/roles", { roles: ["manager"] });
  });
});
