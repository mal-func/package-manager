import { describe, expect, it } from "vitest";

import { loadSeedEnv } from "./seedEnv.js";

const DATABASE_URL = "mysql://u:p@localhost:3306/db";

describe("loadSeedEnv — database", () => {
  it("needs only DATABASE_URL — none of the HTTP server's config", () => {
    expect(loadSeedEnv({ DATABASE_URL })).toEqual({ databaseUrl: DATABASE_URL, initialAdmin: null });
  });

  it("throws when DATABASE_URL is missing", () => {
    expect(() => loadSeedEnv({})).toThrow(/Missing required environment variable: DATABASE_URL/);
  });
});

describe("loadSeedEnv — initial admin", () => {
  const complete = {
    DATABASE_URL,
    SEED_ADMIN_EMAIL: "admin@example.com",
    SEED_ADMIN_PASSWORD: "a-long-enough-password",
    BCRYPT_SALT_ROUNDS: "12",
  };

  it("builds the admin config, defaulting the display name", () => {
    expect(loadSeedEnv(complete).initialAdmin).toEqual({
      email: "admin@example.com",
      name: "Administrator",
      password: "a-long-enough-password",
      bcryptSaltRounds: 12,
    });
  });

  it("uses SEED_ADMIN_NAME when given", () => {
    expect(loadSeedEnv({ ...complete, SEED_ADMIN_NAME: "Ops Lead" }).initialAdmin?.name).toBe("Ops Lead");
  });

  it("rejects an email with no password (a half-configured admin is a mistake, not a skip)", () => {
    expect(() => loadSeedEnv({ DATABASE_URL, SEED_ADMIN_EMAIL: "admin@example.com" })).toThrow(/must be set together/);
  });

  it("rejects a password with no email", () => {
    expect(() => loadSeedEnv({ DATABASE_URL, SEED_ADMIN_PASSWORD: "a-long-enough-password" })).toThrow(
      /must be set together/,
    );
  });

  it("applies the same rules as self-registration — a too-short password is refused", () => {
    expect(() => loadSeedEnv({ ...complete, SEED_ADMIN_PASSWORD: "short" })).toThrow(
      /Invalid initial admin.*password: Password must be at least 8 characters/,
    );
  });

  it("applies the same rules as self-registration — an invalid email is refused", () => {
    expect(() => loadSeedEnv({ ...complete, SEED_ADMIN_EMAIL: "not-an-email" })).toThrow(/Invalid initial admin.*email/);
  });

  it("requires a valid BCRYPT_SALT_ROUNDS when an admin is being created", () => {
    expect(() => loadSeedEnv({ ...complete, BCRYPT_SALT_ROUNDS: undefined })).toThrow(/BCRYPT_SALT_ROUNDS must be a positive integer/);
    expect(() => loadSeedEnv({ ...complete, BCRYPT_SALT_ROUNDS: "0" })).toThrow(/BCRYPT_SALT_ROUNDS must be a positive integer/);
  });
});
