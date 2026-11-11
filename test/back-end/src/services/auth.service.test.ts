import { beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcrypt";

import { ConflictError, ForbiddenError, NotFoundError, UnauthorizedError } from "../errors/index.js";

vi.mock("../repositories/user.repository.js", () => ({
  userRepository: {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    assignRole: vi.fn(),
    recordFailedLogin: vi.fn(),
    resetFailedLogins: vi.fn(),
  },
}));

vi.mock("../repositories/refreshToken.repository.js", () => ({
  refreshTokenRepository: {
    create: vi.fn(),
    findByTokenHash: vi.fn(),
    markRotated: vi.fn(),
    revoke: vi.fn(),
    revokeAllForUser: vi.fn(),
  },
}));

vi.mock("../repositories/role.repository.js", () => ({
  roleRepository: {
    findByName: vi.fn(),
  },
}));

// register() wraps user creation + role assignment in prisma.$transaction()
// for atomicity (see auth.service.ts) -- userRepository is already fully
// mocked above, so the transaction callback's `tx` argument is never
// really used for anything here; this just needs to actually invoke the
// callback (with some object standing in for `tx`) rather than open a
// real DB transaction, which would hang forever with no database to
// connect to in a unit test.
vi.mock("../lib/prisma.js", () => ({
  prisma: {
    $transaction: vi.fn((callback: (tx: unknown) => unknown) => callback({})),
  },
}));

const { prisma } = await import("../lib/prisma.js");
const { userRepository } = await import("../repositories/user.repository.js");
const { refreshTokenRepository } = await import("../repositories/refreshToken.repository.js");
const { roleRepository } = await import("../repositories/role.repository.js");
const { authService } = await import("./auth.service.js");

const context = { ip: "127.0.0.1", userAgent: "vitest" };

function fakeUserWithRoles(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "user-1",
    email: "test@example.com",
    name: "Test User",
    passwordHash: "",
    failedLoginAttempts: 0,
    lockedUntil: null,
    roles: [{ role: { name: "user", permissions: [] } }],
    ...overrides,
  } as never;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("authService.register", () => {
  it("is refused before any lookup when self-registration is turned off", async () => {
    vi.stubEnv("ALLOW_SELF_REGISTRATION", "false");
    vi.resetModules();
    const fresh = await import("./auth.service.js");
    const freshUsers = (await import("../repositories/user.repository.js")).userRepository;
    const { ForbiddenError: FreshForbidden } = await import("../errors/index.js");

    await expect(
      fresh.authService.register({ email: "new@example.com", name: "New", password: "password123" }, context),
    ).rejects.toThrow(FreshForbidden);
    // Not even the duplicate-email check runs, so a closed deployment
    // can't be used to probe which emails have accounts.
    expect(freshUsers.findByEmail).not.toHaveBeenCalled();

    vi.unstubAllEnvs();
  });

  it("rejects a duplicate email with ConflictError", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(fakeUserWithRoles());

    await expect(
      authService.register({ email: "test@example.com", name: "Test", password: "password123" }, context),
    ).rejects.toThrow(ConflictError);
  });

  it("throws if the default 'user' role is missing (unseeded database)", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(roleRepository.findByName).mockResolvedValue(null);

    await expect(
      authService.register({ email: "new@example.com", name: "New", password: "password123" }, context),
    ).rejects.toThrow(/seed/i);
  });

  it("hashes the password before persisting — never stores it in plain text", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(roleRepository.findByName).mockResolvedValue({ id: "role-1" } as never);
    vi.mocked(userRepository.create).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(userRepository.findById).mockResolvedValue(fakeUserWithRoles());

    await authService.register({ email: "new@example.com", name: "New", password: "password123" }, context);

    const createCall = vi.mocked(userRepository.create).mock.calls[0]![0];
    expect(createCall.passwordHash).not.toBe("password123");
    expect(await bcrypt.compare("password123", createCall.passwordHash)).toBe(true);
  });

  it("creates the user and assigns the role atomically via prisma.$transaction — never two unwrapped calls that could leave a roleless user on partial failure", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);
    vi.mocked(roleRepository.findByName).mockResolvedValue({ id: "role-1" } as never);
    vi.mocked(userRepository.create).mockResolvedValue({ id: "user-1" } as never);
    vi.mocked(userRepository.findById).mockResolvedValue(fakeUserWithRoles());

    await authService.register({ email: "new@example.com", name: "New", password: "password123" }, context);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);

    // Both repository calls must receive the *same* transaction client
    // (the `tx` the $transaction callback was invoked with) as their
    // second argument, not the module-level `prisma` singleton — that's
    // what actually makes the two writes atomic, not just co-located.
    const txArg = vi.mocked(userRepository.create).mock.calls[0]![1];
    expect(txArg).toBeDefined();
    expect(vi.mocked(userRepository.assignRole).mock.calls[0]![2]).toBe(txArg);
  });
});

describe("authService.login", () => {
  it("throws the same UnauthorizedError whether the email doesn't exist or the password is wrong", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(null);

    await expect(
      authService.login({ email: "nobody@example.com", password: "whatever" }, context),
    ).rejects.toThrow(UnauthorizedError);
  });

  it("blocks login with ForbiddenError while the account is locked", async () => {
    vi.mocked(userRepository.findByEmail).mockResolvedValue(
      fakeUserWithRoles({ lockedUntil: new Date(Date.now() + 60_000) }),
    );

    await expect(
      authService.login({ email: "test@example.com", password: "whatever" }, context),
    ).rejects.toThrow(ForbiddenError);
  });

  it("records a failed attempt and rejects on wrong password", async () => {
    const correctHash = await bcrypt.hash("correct-password", 4);
    vi.mocked(userRepository.findByEmail).mockResolvedValue(
      fakeUserWithRoles({ passwordHash: correctHash, failedLoginAttempts: 0 }),
    );

    await expect(
      authService.login({ email: "test@example.com", password: "wrong-password" }, context),
    ).rejects.toThrow(UnauthorizedError);

    expect(userRepository.recordFailedLogin).toHaveBeenCalledWith("user-1", 1, null);
  });

  it("locks the account once failedLoginAttempts reaches the configured max", async () => {
    const correctHash = await bcrypt.hash("correct-password", 4);
    vi.mocked(userRepository.findByEmail).mockResolvedValue(
      fakeUserWithRoles({ passwordHash: correctHash, failedLoginAttempts: 4 }),
    );

    await expect(
      authService.login({ email: "test@example.com", password: "wrong-password" }, context),
    ).rejects.toThrow(UnauthorizedError);

    const [, attempts, lockedUntil] = vi.mocked(userRepository.recordFailedLogin).mock.calls[0]!;
    expect(attempts).toBe(5);
    expect(lockedUntil).toBeInstanceOf(Date);
  });

  it("resets failed attempts and returns tokens on correct password", async () => {
    const correctHash = await bcrypt.hash("correct-password", 4);
    vi.mocked(userRepository.findByEmail).mockResolvedValue(
      fakeUserWithRoles({ passwordHash: correctHash, failedLoginAttempts: 3 }),
    );
    vi.mocked(refreshTokenRepository.create).mockResolvedValue({} as never);

    const result = await authService.login({ email: "test@example.com", password: "correct-password" }, context);

    expect(userRepository.resetFailedLogins).toHaveBeenCalledWith("user-1");
    expect(result.user.email).toBe("test@example.com");
    expect(result.accessToken).toBeTruthy();
    expect(result.refreshToken).toBeTruthy();
  });
});

describe("authService.refresh", () => {
  it("throws UnauthorizedError when the token doesn't exist", async () => {
    vi.mocked(refreshTokenRepository.findByTokenHash).mockResolvedValue(null);

    await expect(authService.refresh("nonexistent-token", context)).rejects.toThrow(UnauthorizedError);
  });

  it("revokes every session for the user when a rotated-away token is reused", async () => {
    vi.mocked(refreshTokenRepository.findByTokenHash).mockResolvedValue({
      id: "rt-1",
      userId: "user-1",
      revokedAt: new Date(),
      expiresAt: new Date(Date.now() + 60_000),
    } as never);

    await expect(authService.refresh("stolen-token", context)).rejects.toThrow(UnauthorizedError);
    expect(refreshTokenRepository.revokeAllForUser).toHaveBeenCalledWith("user-1");
  });

  it("throws UnauthorizedError when the token has expired", async () => {
    vi.mocked(refreshTokenRepository.findByTokenHash).mockResolvedValue({
      id: "rt-1",
      userId: "user-1",
      revokedAt: null,
      expiresAt: new Date(Date.now() - 1000),
    } as never);

    await expect(authService.refresh("expired-token", context)).rejects.toThrow(UnauthorizedError);
  });

  it("rotates successfully for a valid, unexpired, unrevoked token", async () => {
    vi.mocked(refreshTokenRepository.findByTokenHash).mockResolvedValue({
      id: "rt-1",
      userId: "user-1",
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
    } as never);
    vi.mocked(userRepository.findById).mockResolvedValue(fakeUserWithRoles());
    vi.mocked(refreshTokenRepository.create).mockResolvedValue({ id: "rt-2" } as never);

    const result = await authService.refresh("valid-token", context);

    expect(refreshTokenRepository.markRotated).toHaveBeenCalledWith("rt-1", "rt-2");
    expect(result.refreshToken).toBeTruthy();
  });
});

describe("authService.logout", () => {
  it("revokes the token when found", async () => {
    vi.mocked(refreshTokenRepository.findByTokenHash).mockResolvedValue({
      id: "rt-1",
      revokedAt: null,
    } as never);

    await authService.logout("some-token");

    expect(refreshTokenRepository.revoke).toHaveBeenCalledWith("rt-1");
  });

  it("does not throw when the token doesn't exist (idempotent)", async () => {
    vi.mocked(refreshTokenRepository.findByTokenHash).mockResolvedValue(null);

    await expect(authService.logout("nonexistent-token")).resolves.not.toThrow();
    expect(refreshTokenRepository.revoke).not.toHaveBeenCalled();
  });
});

describe("authService.getOptions", () => {
  it("reports whether self-registration is on", () => {
    expect(authService.getOptions()).toEqual({ selfRegistration: true });
  });
});

describe("authService.getCurrentUser", () => {
  it("throws NotFoundError when the user no longer exists", async () => {
    vi.mocked(userRepository.findById).mockResolvedValue(null);

    await expect(authService.getCurrentUser("gone-user")).rejects.toThrow(NotFoundError);
  });

  it("returns the safe user shape (no passwordHash) when found", async () => {
    vi.mocked(userRepository.findById).mockResolvedValue(fakeUserWithRoles({ passwordHash: "should-not-leak" }));

    const user = await authService.getCurrentUser("user-1");

    expect(user).not.toHaveProperty("passwordHash");
    expect(user.roles).toEqual(["user"]);
  });
});
