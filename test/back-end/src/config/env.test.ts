import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * config/env.ts validates and builds `env` once, at module load, and
 * throws immediately on anything invalid ("fail fast" — see the
 * module's own doc comment). Testing the failure paths means forcing a
 * fresh module evaluation with a deliberately broken env var each time;
 * vitest.config.ts's baseline `test.env` values supply everything else.
 */
async function importFresh() {
  vi.resetModules();
  return import("./env.js");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("env — happy path", () => {
  it("builds a fully-typed env object from the configured baseline", async () => {
    const { env } = await importFresh();

    expect(env.nodeEnv).toBe("test");
    expect(env.port).toBe(4001);
    expect(env.auth.bcryptSaltRounds).toBe(4);
  });
});

describe("env — required string vars", () => {
  it("throws a descriptive error when a required var is missing", async () => {
    vi.stubEnv("CORS_ORIGIN", "");

    await expect(importFresh()).rejects.toThrow(/Missing required environment variable: CORS_ORIGIN/);
  });
});

describe("env — PORT validation", () => {
  it("throws when PORT is not a valid integer", async () => {
    vi.stubEnv("PORT", "not-a-number");

    await expect(importFresh()).rejects.toThrow(/Invalid PORT/);
  });

  it("throws when PORT is out of the valid 1-65535 range", async () => {
    vi.stubEnv("PORT", "70000");

    await expect(importFresh()).rejects.toThrow(/Invalid PORT/);
  });

  it("throws when PORT is zero or negative", async () => {
    vi.stubEnv("PORT", "0");

    await expect(importFresh()).rejects.toThrow(/Invalid PORT/);
  });
});

describe("env — positive integer validation", () => {
  it("throws when a positive-int var (e.g. BCRYPT_SALT_ROUNDS) isn't an integer", async () => {
    vi.stubEnv("BCRYPT_SALT_ROUNDS", "four");

    await expect(importFresh()).rejects.toThrow(/Invalid BCRYPT_SALT_ROUNDS/);
  });

  it("throws when a positive-int var is zero or negative", async () => {
    vi.stubEnv("ACCOUNT_LOCKOUT_MAX_ATTEMPTS", "-1");

    await expect(importFresh()).rejects.toThrow(/Invalid ACCOUNT_LOCKOUT_MAX_ATTEMPTS/);
  });
});

describe("env — non-negative integer validation (TRUST_PROXY_HOPS)", () => {
  it("accepts 0, the value for a backend with no proxy in front of it", async () => {
    vi.stubEnv("TRUST_PROXY_HOPS", "0");

    const { env } = await importFresh();

    expect(env.trustProxyHops).toBe(0);
  });

  it("throws when negative", async () => {
    vi.stubEnv("TRUST_PROXY_HOPS", "-1");

    await expect(importFresh()).rejects.toThrow(/Invalid TRUST_PROXY_HOPS/);
  });

  it("throws when not an integer (e.g. Express's boolean `true`, which trusts any spoofed hop)", async () => {
    vi.stubEnv("TRUST_PROXY_HOPS", "true");

    await expect(importFresh()).rejects.toThrow(/Invalid TRUST_PROXY_HOPS/);
  });

  it("throws when missing", async () => {
    vi.stubEnv("TRUST_PROXY_HOPS", "");

    await expect(importFresh()).rejects.toThrow(/Missing required environment variable: TRUST_PROXY_HOPS/);
  });
});

describe("env — boolean validation (ALLOW_SELF_REGISTRATION)", () => {
  it("parses exactly \"true\" and \"false\"", async () => {
    vi.stubEnv("ALLOW_SELF_REGISTRATION", "false");
    expect((await importFresh()).env.auth.allowSelfRegistration).toBe(false);

    vi.stubEnv("ALLOW_SELF_REGISTRATION", "true");
    expect((await importFresh()).env.auth.allowSelfRegistration).toBe(true);
  });

  it("rejects anything else rather than guessing (a typo must not silently mean false)", async () => {
    for (const value of ["1", "yes", "TRUE", "on"]) {
      vi.stubEnv("ALLOW_SELF_REGISTRATION", value);
      await expect(importFresh()).rejects.toThrow(/Invalid ALLOW_SELF_REGISTRATION/);
    }
  });
});

describe("env — NODE_ENV validation", () => {
  it("throws when NODE_ENV is not one of the recognized environments", async () => {
    vi.stubEnv("NODE_ENV", "staging-typo");

    await expect(importFresh()).rejects.toThrow(/Invalid NODE_ENV/);
  });

  it("defaults to development when NODE_ENV is unset", async () => {
    vi.stubEnv("NODE_ENV", undefined);

    const { env } = await importFresh();

    expect(env.nodeEnv).toBe("development");
  });

  it("accepts every documented valid environment", async () => {
    for (const value of ["development", "test", "staging", "production"]) {
      vi.stubEnv("NODE_ENV", value);
      const { env } = await importFresh();
      expect(env.nodeEnv).toBe(value);
    }
  });
});
