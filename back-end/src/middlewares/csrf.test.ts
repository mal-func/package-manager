import { describe, expect, it, vi } from "vitest";
import type { NextFunction } from "express";

import { createMockRequest } from "../test-utils/expressMocks.js";
import { ForbiddenError } from "../errors/index.js";
import { CSRF_COOKIE, CSRF_HEADER } from "../lib/cookies.js";
import { requireCsrfToken } from "./csrf.js";

describe("requireCsrfToken", () => {
  it("rejects when there is no CSRF cookie", () => {
    const req = createMockRequest({
      cookies: {},
      header: vi.fn().mockReturnValue("some-header-value"),
    });
    const next = vi.fn();

    requireCsrfToken(req, {} as never, next as NextFunction);

    expect(next).toHaveBeenCalledExactlyOnceWith(expect.any(ForbiddenError));
  });

  it("rejects when there is no CSRF header", () => {
    const req = createMockRequest({
      cookies: { [CSRF_COOKIE]: "token-value" },
      header: vi.fn().mockReturnValue(undefined),
    });
    const next = vi.fn();

    requireCsrfToken(req, {} as never, next as NextFunction);

    expect(next).toHaveBeenCalledExactlyOnceWith(expect.any(ForbiddenError));
  });

  it("rejects when the cookie and header values don't match", () => {
    const req = createMockRequest({
      cookies: { [CSRF_COOKIE]: "token-value" },
      header: vi.fn().mockReturnValue("a-different-value"),
    });
    const next = vi.fn();

    requireCsrfToken(req, {} as never, next as NextFunction);

    expect(next).toHaveBeenCalledExactlyOnceWith(expect.any(ForbiddenError));
  });

  it("allows the request through when the cookie and header match", () => {
    const req = createMockRequest({
      cookies: { [CSRF_COOKIE]: "matching-value" },
      header: vi.fn().mockReturnValue("matching-value"),
    });
    const next = vi.fn();

    requireCsrfToken(req, {} as never, next as NextFunction);

    expect(next).toHaveBeenCalledExactlyOnceWith();
  });

  it("verifies the header is actually read via the correct header name", () => {
    const headerFn = vi.fn().mockReturnValue("value");
    const req = createMockRequest({
      cookies: { [CSRF_COOKIE]: "value" },
      header: headerFn,
    });
    const next = vi.fn();

    requireCsrfToken(req, {} as never, next as NextFunction);

    expect(headerFn).toHaveBeenCalledWith(CSRF_HEADER);
  });
});
