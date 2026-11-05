import type { Request, Response } from "express";
import { vi } from "vitest";

/**
 * Minimal Express Request mock for middleware unit tests — only the
 * shape each middleware actually reads (cookies, header()) is real;
 * everything else is cast away rather than faked.
 */
export function createMockRequest(overrides: Partial<Request> = {}): Request {
  return {
    cookies: {},
    header: vi.fn().mockReturnValue(undefined),
    ...overrides,
  } as unknown as Request;
}

/**
 * Minimal Express Response mock for controller unit tests — `status()`
 * is chainable (mirrors Express's real return-this behavior) so
 * `res.status(x).json(y)` and `res.cookie(...).cookie(...)` work as
 * written in real handlers.
 */
export function createMockResponse(): Response {
  const res = {
    status: vi.fn(),
    json: vi.fn(),
    cookie: vi.fn(),
    clearCookie: vi.fn(),
  };
  res.status.mockReturnValue(res);
  res.cookie.mockReturnValue(res);
  res.clearCookie.mockReturnValue(res);

  return res as unknown as Response;
}
