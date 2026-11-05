import { afterEach, describe, expect, it, vi } from "vitest";
import type { Response } from "express";

import { env } from "../config/index.js";
import { ACCESS_TOKEN_EXPIRES_IN_MS } from "../services/token.service.js";
import {
  ACCESS_TOKEN_COOKIE,
  CSRF_COOKIE,
  clearAuthCookies,
  REFRESH_TOKEN_COOKIE,
  setAuthCookies,
} from "./cookies.js";

function createMockResponse(): Response {
  return {
    cookie: vi.fn(),
    clearCookie: vi.fn(),
  } as unknown as Response;
}

const tokens = { accessToken: "access-value", refreshToken: "refresh-value" };

describe("setAuthCookies", () => {
  it("sets the access token cookie, httpOnly, on the root path", () => {
    const res = createMockResponse();

    setAuthCookies(res, tokens);

    // Regression guard for the bug this replaces: maxAge used to be a
    // hardcoded 15 * 60 * 1000, independent of JWT_ACCESS_EXPIRES_IN --
    // asserting against the same shared constant cookies.ts actually
    // reads (not a second hardcoded literal here) means this test can't
    // silently drift from reality the same way the old code could.
    expect(res.cookie).toHaveBeenCalledWith(
      ACCESS_TOKEN_COOKIE,
      "access-value",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: ACCESS_TOKEN_EXPIRES_IN_MS,
      }),
    );
  });

  it("sets the refresh token cookie, httpOnly, scoped to the auth routes only", () => {
    const res = createMockResponse();

    setAuthCookies(res, tokens);

    expect(res.cookie).toHaveBeenCalledWith(
      REFRESH_TOKEN_COOKIE,
      "refresh-value",
      expect.objectContaining({
        httpOnly: true,
        sameSite: "lax",
        path: "/api/v1/auth",
        maxAge: env.auth.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000,
      }),
    );
  });

  it("sets a readable (non-httpOnly) CSRF cookie on the root path", () => {
    const res = createMockResponse();

    setAuthCookies(res, tokens);

    expect(res.cookie).toHaveBeenCalledWith(
      CSRF_COOKIE,
      expect.any(String),
      expect.objectContaining({ httpOnly: false, sameSite: "lax", path: "/" }),
    );
  });

  it("generates a different, sufficiently random CSRF token per call", () => {
    const res = createMockResponse();

    setAuthCookies(res, tokens);
    setAuthCookies(res, tokens);

    const csrfCalls = vi.mocked(res.cookie).mock.calls.filter(([name]) => name === CSRF_COOKIE);
    const firstValue = csrfCalls[0]![1];
    const secondValue = csrfCalls[1]![1];

    expect(firstValue).not.toBe(secondValue);
    expect(firstValue).toMatch(/^[0-9a-f]{48}$/);
  });

  it("marks cookies non-secure outside production", () => {
    const res = createMockResponse();

    setAuthCookies(res, tokens);

    const [, , options] = vi.mocked(res.cookie).mock.calls[0]! as unknown as [string, string, { secure: boolean }];
    expect(options.secure).toBe(false);
  });
});

describe("setAuthCookies in production", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("marks cookies secure when NODE_ENV is production", async () => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "production");

    const { setAuthCookies: setAuthCookiesInProd } = await import("./cookies.js");
    const res = createMockResponse();

    setAuthCookiesInProd(res, tokens);

    const [, , options] = vi.mocked(res.cookie).mock.calls[0]! as unknown as [string, string, { secure: boolean }];
    expect(options.secure).toBe(true);
  });

  it("also marks cookies secure when NODE_ENV is staging", async () => {
    vi.resetModules();
    vi.stubEnv("NODE_ENV", "staging");

    const { setAuthCookies: setAuthCookiesInStaging } = await import("./cookies.js");
    const res = createMockResponse();

    setAuthCookiesInStaging(res, tokens);

    const [, , options] = vi.mocked(res.cookie).mock.calls[0]! as unknown as [string, string, { secure: boolean }];
    expect(options.secure).toBe(true);
  });
});

describe("clearAuthCookies", () => {
  it("clears all three auth cookies on their matching paths", () => {
    const res = createMockResponse();

    clearAuthCookies(res);

    expect(res.clearCookie).toHaveBeenCalledWith(ACCESS_TOKEN_COOKIE, { path: "/" });
    expect(res.clearCookie).toHaveBeenCalledWith(REFRESH_TOKEN_COOKIE, { path: "/api/v1/auth" });
    expect(res.clearCookie).toHaveBeenCalledWith(CSRF_COOKIE, { path: "/" });
    expect(res.clearCookie).toHaveBeenCalledTimes(3);
  });
});
