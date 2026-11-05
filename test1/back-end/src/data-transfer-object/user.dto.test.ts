import { describe, expect, it } from "vitest";

import { setUserRolesSchema } from "./user.dto.js";

describe("setUserRolesSchema", () => {
  it("accepts a list of role names, trimming and de-duplicating them", () => {
    expect(setUserRolesSchema.parse({ roles: [" manager ", "manager", "user"] })).toEqual({ roles: ["manager", "user"] });
  });

  it("requires at least one role", () => {
    expect(setUserRolesSchema.safeParse({ roles: [] }).error?.issues[0]?.message).toBe("A user must keep at least one role.");
  });

  it("rejects blank role names and a missing/non-array body", () => {
    expect(setUserRolesSchema.safeParse({ roles: ["  "] }).success).toBe(false);
    expect(setUserRolesSchema.safeParse({}).success).toBe(false);
    expect(setUserRolesSchema.safeParse({ roles: "admin" }).success).toBe(false);
  });
});
