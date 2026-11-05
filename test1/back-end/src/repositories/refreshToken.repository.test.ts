import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/prisma.js", () => ({
  prisma: {
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

const { prisma } = await import("../lib/prisma.js");
const { refreshTokenRepository } = await import("./refreshToken.repository.js");

beforeEach(() => {
  vi.clearAllMocks();
});

describe("refreshTokenRepository.create", () => {
  it("passes the input straight through as the create data", async () => {
    const input = {
      userId: "u1",
      tokenHash: "hash",
      expiresAt: new Date("2026-02-01T00:00:00Z"),
      createdByIp: "127.0.0.1",
      userAgent: "vitest",
    };
    vi.mocked(prisma.refreshToken.create).mockResolvedValue({ id: "rt1", ...input } as never);

    await refreshTokenRepository.create(input);

    expect(prisma.refreshToken.create).toHaveBeenCalledWith({ data: input });
  });
});

describe("refreshTokenRepository.findByTokenHash", () => {
  it("looks up the token by its hash", async () => {
    vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue({ id: "rt1" } as never);

    const result = await refreshTokenRepository.findByTokenHash("hash-value");

    expect(prisma.refreshToken.findUnique).toHaveBeenCalledWith({ where: { tokenHash: "hash-value" } });
    expect(result).toEqual({ id: "rt1" });
  });
});

describe("refreshTokenRepository.markRotated", () => {
  it("revokes the old token and links it to its replacement", async () => {
    vi.mocked(prisma.refreshToken.update).mockResolvedValue({} as never);

    await refreshTokenRepository.markRotated("rt-old", "rt-new");

    const call = vi.mocked(prisma.refreshToken.update).mock.calls[0]![0];
    expect(call.where).toEqual({ id: "rt-old" });
    expect(call.data.replacedByTokenId).toBe("rt-new");
    expect(call.data.revokedAt).toBeInstanceOf(Date);
  });
});

describe("refreshTokenRepository.revoke", () => {
  it("sets revokedAt on the given token", async () => {
    vi.mocked(prisma.refreshToken.update).mockResolvedValue({} as never);

    await refreshTokenRepository.revoke("rt1");

    const call = vi.mocked(prisma.refreshToken.update).mock.calls[0]![0];
    expect(call.where).toEqual({ id: "rt1" });
    expect(call.data.revokedAt).toBeInstanceOf(Date);
  });
});

describe("refreshTokenRepository.revokeAllForUser", () => {
  it("revokes every currently-active token for the user", async () => {
    vi.mocked(prisma.refreshToken.updateMany).mockResolvedValue({ count: 3 } as never);

    await refreshTokenRepository.revokeAllForUser("u1");

    const call = vi.mocked(prisma.refreshToken.updateMany).mock.calls[0]![0];
    expect(call.where).toEqual({ userId: "u1", revokedAt: null });
    expect(call.data.revokedAt).toBeInstanceOf(Date);
  });
});
