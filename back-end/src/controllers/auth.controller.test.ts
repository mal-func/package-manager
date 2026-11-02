import { beforeEach, describe, expect, it, vi } from "vitest";

import { createMockRequest, createMockResponse } from "../test-utils/expressMocks.js";
import { UnauthorizedError } from "../errors/index.js";
import { REFRESH_TOKEN_COOKIE } from "../lib/cookies.js";

vi.mock("../services/auth.service.js", () => ({
  authService: {
    register: vi.fn(),
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
    getCurrentUser: vi.fn(),
    getOptions: vi.fn(),
  },
}));

const { authService } = await import("../services/auth.service.js");
const { login, logout, me, options, refresh, register } = await import("./auth.controller.js");

const safeUser = { id: "u1", email: "test@example.com", name: "Test User", roles: ["user"], permissions: [] };
const authResult = { user: safeUser, accessToken: "access-token", refreshToken: "refresh-token" };

beforeEach(() => {
  vi.clearAllMocks();
});

describe("register", () => {
  it("registers, sets auth cookies, and returns the user with 201", async () => {
    vi.mocked(authService.register).mockResolvedValue(authResult);
    const req = createMockRequest({ body: { email: "test@example.com", name: "Test User", password: "password123" } });
    const res = createMockResponse();

    await register(req, res);

    expect(authService.register).toHaveBeenCalledWith(req.body, expect.objectContaining({ ip: req.ip }));
    expect(res.cookie).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { user: safeUser } });
  });
});

describe("login", () => {
  it("logs in, sets auth cookies, and returns the user with 200", async () => {
    vi.mocked(authService.login).mockResolvedValue(authResult);
    const req = createMockRequest({ body: { email: "test@example.com", password: "password123" } });
    const res = createMockResponse();

    await login(req, res);

    expect(authService.login).toHaveBeenCalledWith(req.body, expect.objectContaining({ ip: req.ip }));
    expect(res.cookie).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { user: safeUser } });
  });
});

describe("refresh", () => {
  it("rejects with UnauthorizedError when there is no refresh token cookie", async () => {
    const req = createMockRequest({ cookies: {} });
    const res = createMockResponse();

    await expect(refresh(req, res)).rejects.toThrow(UnauthorizedError);
    expect(authService.refresh).not.toHaveBeenCalled();
  });

  it("rotates the session and returns the refreshed user", async () => {
    vi.mocked(authService.refresh).mockResolvedValue(authResult);
    const req = createMockRequest({ cookies: { [REFRESH_TOKEN_COOKIE]: "old-refresh-token" } });
    const res = createMockResponse();

    await refresh(req, res);

    expect(authService.refresh).toHaveBeenCalledWith("old-refresh-token", expect.objectContaining({ ip: req.ip }));
    expect(res.cookie).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { user: safeUser } });
  });
});

describe("logout", () => {
  it("revokes the session, clears cookies, and confirms logout when a token is present", async () => {
    vi.mocked(authService.logout).mockResolvedValue(undefined);
    const req = createMockRequest({ cookies: { [REFRESH_TOKEN_COOKIE]: "some-token" } });
    const res = createMockResponse();

    await logout(req, res);

    expect(authService.logout).toHaveBeenCalledWith("some-token");
    expect(res.clearCookie).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { message: "Logged out successfully." } });
  });

  it("still clears cookies and succeeds even with no token present (idempotent)", async () => {
    const req = createMockRequest({ cookies: {} });
    const res = createMockResponse();

    await logout(req, res);

    expect(authService.logout).not.toHaveBeenCalled();
    expect(res.clearCookie).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
  });
});

describe("me", () => {
  it("returns req.user as loaded by requireAuth, with no further DB lookup", () => {
    const req = createMockRequest({ userId: "u1", user: safeUser });
    const res = createMockResponse();

    me(req, res);

    expect(authService.getCurrentUser).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { user: safeUser } });
  });
});

describe("options", () => {
  it("returns the public auth options from the service", () => {
    vi.mocked(authService.getOptions).mockReturnValue({ selfRegistration: false });
    const res = createMockResponse();

    options(createMockRequest(), res);

    expect(res.json).toHaveBeenCalledWith({ success: true, data: { selfRegistration: false } });
  });
});
