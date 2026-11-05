import { randomBytes } from "node:crypto";

import type { Response } from "express";

import { env } from "../config/index.js";
import { ACCESS_TOKEN_EXPIRES_IN_MS } from "../services/token.service.js";

export const ACCESS_TOKEN_COOKIE = "access_token";
export const REFRESH_TOKEN_COOKIE = "refresh_token";
export const CSRF_COOKIE = "csrf_token";
export const CSRF_HEADER = "x-csrf-token";

/**
 * Refresh cookie is scoped to the auth routes only — the browser never
 * attaches it to unrelated API calls, shrinking where it can leak.
 */
const REFRESH_COOKIE_PATH = "/api/v1/auth";

// "production" only would silently ship non-Secure cookies on a
// staging deployment — env.ts allows "staging" as a valid NODE_ENV,
// so it needs the same cookie hardening as production does.
const secure = env.nodeEnv === "production" || env.nodeEnv === "staging";

export function setAuthCookies(res: Response, tokens: { accessToken: string; refreshToken: string }): void {
  res.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: "/",
    // Derived from the same JWT_ACCESS_EXPIRES_IN value the JWT itself
    // is signed with (token.service.ts), not an independent literal —
    // see that constant's docstring for why this can no longer drift
    // from the token's real expiry the way a hardcoded number could.
    maxAge: ACCESS_TOKEN_EXPIRES_IN_MS,
  });

  res.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    secure,
    sameSite: "lax",
    path: REFRESH_COOKIE_PATH,
    maxAge: env.auth.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000,
  });

  // Readable by frontend JS on purpose — the double-submit CSRF pattern
  // relies on JS being able to read this and echo it back as a header.
  res.cookie(CSRF_COOKIE, randomBytes(24).toString("hex"), {
    httpOnly: false,
    secure,
    sameSite: "lax",
    path: "/",
    maxAge: env.auth.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(ACCESS_TOKEN_COOKIE, { path: "/" });
  res.clearCookie(REFRESH_TOKEN_COOKIE, { path: REFRESH_COOKIE_PATH });
  res.clearCookie(CSRF_COOKIE, { path: "/" });
}
