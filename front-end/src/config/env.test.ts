import { afterEach, describe, expect, it, vi } from "vitest";

async function importFresh() {
  vi.resetModules();
  return import("./env.js");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("env — happy path", () => {
  it("builds the env object from the configured baseline", async () => {
    const { env } = await importFresh();

    expect(env.appName).toBe("CDIS");
    expect(env.appEnv).toBe("development");
    expect(env.apiBaseUrl).toBe("http://localhost:4000/api/v1");
  });
});

describe("env — required vars", () => {
  it("throws when VITE_APP_NAME is missing", async () => {
    vi.stubEnv("VITE_APP_NAME", "");

    await expect(importFresh()).rejects.toThrow(/Missing required environment variable: VITE_APP_NAME/);
  });

  it("throws when VITE_APP_ENV is missing", async () => {
    vi.stubEnv("VITE_APP_ENV", "");

    await expect(importFresh()).rejects.toThrow(/Missing required environment variable: VITE_APP_ENV/);
  });

  it("throws when VITE_API_BASE_URL is missing", async () => {
    vi.stubEnv("VITE_API_BASE_URL", "");

    await expect(importFresh()).rejects.toThrow(/Missing required environment variable: VITE_API_BASE_URL/);
  });
});

describe("env — VITE_APP_ENV validation", () => {
  it("throws when VITE_APP_ENV isn't one of the recognized environments", async () => {
    vi.stubEnv("VITE_APP_ENV", "not-a-real-env");

    await expect(importFresh()).rejects.toThrow(/Invalid VITE_APP_ENV/);
  });

  it("accepts every documented valid environment", async () => {
    for (const value of ["development", "testing", "staging", "production"]) {
      vi.stubEnv("VITE_APP_ENV", value);
      const { env } = await importFresh();
      expect(env.appEnv).toBe(value);
    }
  });
});
