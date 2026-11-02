import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../api", () => ({
  authApi: { login: vi.fn(), register: vi.fn(), getCurrentUser: vi.fn(), logout: vi.fn() },
}));

const { authApi } = await import("../api");
const { authService } = await import("./authService");

const user = { id: "u1", name: "Test", email: "t@example.com", roles: ["user"], permissions: [] };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("authService", () => {
  it("login unwraps the user from the auth response envelope", async () => {
    vi.mocked(authApi.login).mockResolvedValue({ user });

    await expect(authService.login({ email: "t@example.com", password: "pw" })).resolves.toEqual(user);
  });

  it("register unwraps the new user from the auth response envelope", async () => {
    vi.mocked(authApi.register).mockResolvedValue({ user });

    await expect(authService.register({ name: "Test", email: "t@example.com", password: "password123" })).resolves.toEqual(user);
  });

  it("getCurrentUser unwraps the user from the auth response envelope", async () => {
    vi.mocked(authApi.getCurrentUser).mockResolvedValue({ user });

    await expect(authService.getCurrentUser()).resolves.toEqual(user);
  });

  it("logout delegates to authApi.logout and resolves with nothing", async () => {
    vi.mocked(authApi.logout).mockResolvedValue(undefined);

    await expect(authService.logout()).resolves.toBeUndefined();
    expect(authApi.logout).toHaveBeenCalledOnce();
  });
});
