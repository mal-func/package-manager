import { describe, expect, it } from "vitest";

import { toSafeUser, type UserWithRoles } from "./user.mapper.js";

function fakeUser(overrides: Partial<UserWithRoles> = {}): UserWithRoles {
  return {
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
    passwordHash: "should-not-leak",
    roles: [],
    ...overrides,
  } as unknown as UserWithRoles;
}

describe("toSafeUser", () => {
  it("keeps only id, email, name, roles, permissions — never passwordHash", () => {
    const user = fakeUser({
      roles: [{ role: { name: "user", permissions: [] } }],
    } as never);

    const result = toSafeUser(user);

    expect(result).toEqual({
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
      roles: ["user"],
      permissions: [],
    });
    expect(result).not.toHaveProperty("passwordHash");
  });

  it("flattens every assigned role name", () => {
    const user = fakeUser({
      roles: [
        { role: { name: "user", permissions: [] } },
        { role: { name: "manager", permissions: [] } },
      ],
    } as never);

    expect(toSafeUser(user).roles).toEqual(["user", "manager"]);
  });

  it("flattens permissions across all roles", () => {
    const user = fakeUser({
      roles: [
        { role: { name: "manager", permissions: [{ permission: { key: "users:read" } }] } },
      ],
    } as never);

    expect(toSafeUser(user).permissions).toEqual(["users:read"]);
  });

  it("de-duplicates a permission shared by more than one role", () => {
    const user = fakeUser({
      roles: [
        { role: { name: "manager", permissions: [{ permission: { key: "users:read" } }] } },
        { role: { name: "admin", permissions: [{ permission: { key: "users:read" } }, { permission: { key: "users:write" } }] } },
      ],
    } as never);

    expect(toSafeUser(user).permissions.sort()).toEqual(["users:read", "users:write"]);
  });

  it("returns empty roles/permissions for a user with no role assignments", () => {
    const user = fakeUser({ roles: [] });

    expect(toSafeUser(user)).toEqual({
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
      roles: [],
      permissions: [],
    });
  });
});
