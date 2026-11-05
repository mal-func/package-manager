import { describe, expect, it } from "vitest";

import { loginSchema, registerSchema } from "./auth.dto.js";

describe("registerSchema", () => {
  it("accepts valid input as-is", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      name: "Test User",
      password: "password123",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({ email: "test@example.com", name: "Test User", password: "password123" });
    }
  });

  it("trims surrounding whitespace from name (trim runs before the min-length check)", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      name: "  Test User  ",
      password: "password123",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Test User");
    }
  });

  it("rejects an invalid email", () => {
    const result = registerSchema.safeParse({ email: "not-an-email", name: "Test", password: "password123" });

    expect(result.success).toBe(false);
  });

  it("trims surrounding whitespace from email before validating its format", () => {
    const result = registerSchema.safeParse({
      email: "  test@example.com  ",
      name: "Test",
      password: "password123",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("test@example.com");
    }
  });

  it("rejects a name that is entirely whitespace (trims to empty, then fails min-length)", () => {
    const result = registerSchema.safeParse({ email: "test@example.com", name: "  ", password: "password123" });

    expect(result.success).toBe(false);
  });

  it("rejects a name over 255 characters", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      name: "a".repeat(256),
      password: "password123",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = registerSchema.safeParse({ email: "test@example.com", name: "Test", password: "short" });

    expect(result.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("accepts valid input as-is", () => {
    const result = loginSchema.safeParse({ email: "test@example.com", password: "anything" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("test@example.com");
    }
  });

  it("trims surrounding whitespace from email before validating its format", () => {
    const result = loginSchema.safeParse({ email: "  test@example.com  ", password: "anything" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("test@example.com");
    }
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "anything" });

    expect(result.success).toBe(false);
  });

  it("rejects an empty password (unlike register, no minimum length beyond 'present')", () => {
    const result = loginSchema.safeParse({ email: "test@example.com", password: "" });

    expect(result.success).toBe(false);
  });
});
