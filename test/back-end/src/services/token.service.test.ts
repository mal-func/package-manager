import { describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";

import { env } from "../config/index.js";
import { ACCESS_TOKEN_EXPIRES_IN_MS, tokenService } from "./token.service.js";

describe("tokenService.signAccessToken / verifyAccessToken", () => {
  it("signs a token that verifies back to the same user id", () => {
    const token = tokenService.signAccessToken("user-123");
    const payload = tokenService.verifyAccessToken(token);

    expect(payload.sub).toBe("user-123");
  });

  it("rejects a token signed with a different secret", () => {
    const forged = jwt.sign({ sub: "attacker" }, "wrong-secret");

    expect(() => tokenService.verifyAccessToken(forged)).toThrow();
  });

  it("rejects a tampered token", () => {
    const token = tokenService.signAccessToken("user-123");
    const tampered = `${token.slice(0, -1)}${token.at(-1) === "a" ? "b" : "a"}`;

    expect(() => tokenService.verifyAccessToken(tampered)).toThrow();
  });
});

describe("tokenService.generateRefreshTokenValue", () => {
  it("produces sufficiently random, unique 256-bit values", () => {
    const a = tokenService.generateRefreshTokenValue();
    const b = tokenService.generateRefreshTokenValue();

    expect(a).not.toBe(b);
    expect(a).toHaveLength(64); // 32 bytes, hex-encoded
    expect(a).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe("tokenService.hashRefreshToken", () => {
  it("is deterministic for the same input", () => {
    const raw = tokenService.generateRefreshTokenValue();

    expect(tokenService.hashRefreshToken(raw)).toBe(tokenService.hashRefreshToken(raw));
  });

  it("never returns the raw value back", () => {
    const raw = tokenService.generateRefreshTokenValue();

    expect(tokenService.hashRefreshToken(raw)).not.toBe(raw);
  });

  it("produces different hashes for different inputs", () => {
    const a = tokenService.hashRefreshToken(tokenService.generateRefreshTokenValue());
    const b = tokenService.hashRefreshToken(tokenService.generateRefreshTokenValue());

    expect(a).not.toBe(b);
  });
});

describe("ACCESS_TOKEN_EXPIRES_IN_MS", () => {
  it("matches JWT_ACCESS_EXPIRES_IN parsed to milliseconds (test env: 15m)", () => {
    expect(ACCESS_TOKEN_EXPIRES_IN_MS).toBe(15 * 60 * 1000);
  });

  it("is the exact lifetime a real signed access token actually has -- the bug this constant fixes was a cookie maxAge that could silently disagree with this", () => {
    const before = Math.floor(Date.now() / 1000);
    const token = tokenService.signAccessToken("user-123");
    const decoded = jwt.decode(token) as { exp: number; iat: number };

    expect(decoded.exp - decoded.iat).toBe(ACCESS_TOKEN_EXPIRES_IN_MS / 1000);
    expect(decoded.exp).toBeGreaterThanOrEqual(before + ACCESS_TOKEN_EXPIRES_IN_MS / 1000);
  });
});

describe("tokenService.refreshTokenExpiryDate", () => {
  it("returns a date REFRESH_TOKEN_EXPIRES_IN_DAYS days in the future", () => {
    const before = Date.now();
    const expiry = tokenService.refreshTokenExpiryDate();
    const after = Date.now();

    const expectedMs = env.auth.refreshTokenExpiresInDays * 24 * 60 * 60 * 1000;

    expect(expiry.getTime()).toBeGreaterThanOrEqual(before + expectedMs - 1000);
    expect(expiry.getTime()).toBeLessThanOrEqual(after + expectedMs + 1000);
  });
});
