import { describe, expect, it } from "vitest";

import { loginSchema } from "./loginSchema";

describe("loginSchema", () => {
  it("accepts a valid email/password as-is", () => {
    const result = loginSchema.safeParse({ email: "test@example.com", password: "password123" });

    expect(result.success).toBe(true);
  });

  it("trims surrounding whitespace from the email before validating its format", () => {
    const result = loginSchema.safeParse({ email: "  test@example.com  ", password: "password123" });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("test@example.com");
    }
  });

  it("rejects an invalid email", () => {
    const result = loginSchema.safeParse({ email: "not-an-email", password: "password123" });

    expect(result.success).toBe(false);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = loginSchema.safeParse({ email: "test@example.com", password: "short" });

    expect(result.success).toBe(false);
  });
});
