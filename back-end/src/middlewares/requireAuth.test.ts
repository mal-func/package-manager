import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextFunction } from "express";

import { createMockRequest } from "../test-utils/expressMocks.js";
import { UnauthorizedError } from "../errors/index.js";
import { tokenService } from "../services/token.service.js";
import { ACCESS_TOKEN_COOKIE } from "../lib/cookies.js";

vi.mock("../services/auth.service.js", () => ({
  authService: {
    getCurrentUser: vi.fn(),
  },
}));

const { authService } = await import("../services/auth.service.js");
const { requireAuth } = await import("./requireAuth.js");

const safeUser = {
  id: "user-42",
  email: "test@example.com",
  name: "Test User",
  roles: ["user"],
  permissions: [],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requireAuth", () => {
  it("rejects with UnauthorizedError when there is no access token cookie", async () => {
    const req = createMockRequest({ cookies: {} });
    const next = vi.fn();

    await requireAuth(req, {} as never, next as NextFunction);

    expect(next).toHaveBeenCalledExactlyOnceWith(expect.any(UnauthorizedError));
    expect(req.userId).toBeUndefined();
    expect(authService.getCurrentUser).not.toHaveBeenCalled();
  });

  it("rejects with UnauthorizedError when the token is invalid or expired", async () => {
    const req = createMockRequest({ cookies: { [ACCESS_TOKEN_COOKIE]: "not-a-real-jwt" } });
    const next = vi.fn();

    await requireAuth(req, {} as never, next as NextFunction);

    expect(next).toHaveBeenCalledExactlyOnceWith(expect.any(UnauthorizedError));
    expect(req.userId).toBeUndefined();
    expect(authService.getCurrentUser).not.toHaveBeenCalled();
  });

  it("rejects with the same UnauthorizedError when the token is valid but the account no longer exists", async () => {
    // A signature-valid, unexpired token for an account deleted (or
    // soft-deleted) since it was issued — this is exactly the gap that
    // used to let a vanished user keep hitting bare-requireAuth routes
    // for up to the token's remaining lifetime.
    vi.mocked(authService.getCurrentUser).mockRejectedValue(new Error("not found"));
    const token = tokenService.signAccessToken("ghost-user");
    const req = createMockRequest({ cookies: { [ACCESS_TOKEN_COOKIE]: token } });
    const next = vi.fn();

    await requireAuth(req, {} as never, next as NextFunction);

    expect(next).toHaveBeenCalledExactlyOnceWith(expect.any(UnauthorizedError));
    expect(req.userId).toBeUndefined();
    expect(req.user).toBeUndefined();
  });

  it("attaches req.userId and req.user, and calls next() with no error for a valid token to a real account", async () => {
    vi.mocked(authService.getCurrentUser).mockResolvedValue(safeUser);
    const token = tokenService.signAccessToken("user-42");
    const req = createMockRequest({ cookies: { [ACCESS_TOKEN_COOKIE]: token } });
    const next = vi.fn();

    await requireAuth(req, {} as never, next as NextFunction);

    expect(authService.getCurrentUser).toHaveBeenCalledWith("user-42");
    expect(req.userId).toBe("user-42");
    expect(req.user).toEqual(safeUser);
    expect(next).toHaveBeenCalledExactlyOnceWith();
  });
});
