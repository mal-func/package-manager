import { describe, expect, it, vi } from "vitest";
import type { NextFunction } from "express";

import { createMockRequest } from "../test-utils/expressMocks.js";
import { ForbiddenError, UnauthorizedError } from "../errors/index.js";
import { requirePermission } from "./requirePermission.js";

const safeUser = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
  roles: ["manager"],
  permissions: ["users:read"],
};

describe("requirePermission", () => {
  it("rejects with UnauthorizedError when req.user is not set (requireAuth didn't run)", () => {
    const req = createMockRequest();
    const next = vi.fn();

    requirePermission("users:read")(req, {} as never, next as NextFunction);

    expect(next).toHaveBeenCalledExactlyOnceWith(expect.any(UnauthorizedError));
  });

  it("calls next() with no error when the user has the required permission", () => {
    const req = createMockRequest({ user: safeUser });
    const next = vi.fn();

    requirePermission("users:read")(req, {} as never, next as NextFunction);

    expect(next).toHaveBeenCalledExactlyOnceWith();
  });

  it("rejects with ForbiddenError when the user lacks the required permission", () => {
    const req = createMockRequest({ user: safeUser });
    const next = vi.fn();

    requirePermission("users:write")(req, {} as never, next as NextFunction);

    expect(next).toHaveBeenCalledExactlyOnceWith(expect.any(ForbiddenError));
  });

  it("allows access if the user has at least one of several required permissions", () => {
    const req = createMockRequest({ user: safeUser });
    const next = vi.fn();

    requirePermission(["roles:manage", "users:read"])(req, {} as never, next as NextFunction);

    expect(next).toHaveBeenCalledExactlyOnceWith();
  });
});
