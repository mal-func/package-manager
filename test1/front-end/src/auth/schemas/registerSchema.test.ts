import { describe, expect, it } from "vitest";

import { registerSchema } from "./registerSchema";

const valid = { name: "Jane Doe", email: "jane@example.com", password: "long-enough", confirmPassword: "long-enough" };

function messagesFor(values: Partial<typeof valid>) {
  const result = registerSchema.safeParse({ ...valid, ...values });
  return result.success ? [] : result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
}

describe("registerSchema", () => {
  it("accepts a complete, matching form and trims name/email", () => {
    expect(registerSchema.parse({ ...valid, name: "  Jane Doe ", email: " jane@example.com " })).toMatchObject({
      name: "Jane Doe",
      email: "jane@example.com",
    });
  });

  it("matches the backend's rules: name required, valid email, 8+ char password", () => {
    expect(messagesFor({ name: "  " })).toEqual(["name: Please enter your name."]);
    expect(messagesFor({ email: "nope" })).toEqual(["email: Please enter a valid email address."]);
    expect(messagesFor({ password: "short", confirmPassword: "short" })).toEqual([
      "password: Password must contain at least 8 characters.",
    ]);
  });

  it("reports mismatched passwords on the confirm field", () => {
    expect(messagesFor({ confirmPassword: "something-else" })).toEqual(["confirmPassword: Passwords don't match."]);
  });
});
