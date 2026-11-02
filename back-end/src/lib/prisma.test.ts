import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const PrismaMariaDbMock = vi.fn().mockImplementation(function (this: unknown, url: string) {
  Object.assign(this as object, { __adapterFor: url });
});
const PrismaClientMock = vi.fn().mockImplementation(function (this: unknown, opts: unknown) {
  Object.assign(this as object, { __client: true, opts });
});

vi.mock("@prisma/adapter-mariadb", () => ({
  PrismaMariaDb: PrismaMariaDbMock,
}));

vi.mock("../../generated/prisma/client.js", () => ({
  PrismaClient: PrismaClientMock,
}));

type GlobalWithPrisma = typeof globalThis & { prisma?: unknown };

async function importFresh() {
  vi.resetModules();
  return import("./prisma.js");
}

beforeEach(() => {
  vi.clearAllMocks();
  delete (globalThis as GlobalWithPrisma).prisma;
});

afterEach(() => {
  vi.unstubAllEnvs();
  delete (globalThis as GlobalWithPrisma).prisma;
});

describe("prisma singleton — outside production", () => {
  it("builds a new client via the MariaDB adapter when none is cached yet", async () => {
    const { prisma } = await importFresh();

    expect(PrismaMariaDbMock).toHaveBeenCalledOnce();
    expect(PrismaClientMock).toHaveBeenCalledOnce();
    expect(prisma).toEqual({ __client: true, opts: expect.anything() });
  });

  it("caches the client on globalThis so hot reloads reuse the same connection pool", async () => {
    await importFresh();

    expect((globalThis as GlobalWithPrisma).prisma).toBeDefined();
  });

  it("reuses the cached client on a subsequent import instead of constructing a new one", async () => {
    const { prisma: first } = await importFresh();

    const { prisma: second } = await importFresh();

    // Only the first import should have actually constructed a client —
    // the second must reuse what's already on globalThis.
    expect(PrismaClientMock).toHaveBeenCalledOnce();
    expect(second).toBe(first);
  });
});

describe("prisma singleton — in production", () => {
  it("does not cache the client on globalThis", async () => {
    vi.stubEnv("NODE_ENV", "production");

    await importFresh();

    expect((globalThis as GlobalWithPrisma).prisma).toBeUndefined();
  });

  it("still builds a working client via the MariaDB adapter", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const { prisma } = await importFresh();

    expect(PrismaMariaDbMock).toHaveBeenCalledOnce();
    expect(prisma).toEqual({ __client: true, opts: expect.anything() });
  });
});
