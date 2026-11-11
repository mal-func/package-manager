import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fakeServer = { close: vi.fn((cb: () => void) => { cb(); }) };
const listenMock = vi.fn((_port: number, cb: () => void) => {
  cb();
  return fakeServer;
});

vi.mock("./app.js", () => ({
  createApp: vi.fn(() => ({ listen: listenMock })),
}));

vi.mock("./lib/prisma.js", () => ({
  prisma: { $disconnect: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock("./lib/logger.js", () => ({
  logger: { info: vi.fn() },
}));

const { prisma } = await import("./lib/prisma.js");
const { logger } = await import("./lib/logger.js");

/** Flushes pending microtasks — shutdown()'s async work isn't awaited by process.emit(). */
async function flush(): Promise<void> {
  await new Promise((resolve) => setImmediate(resolve));
  await new Promise((resolve) => setImmediate(resolve));
}

beforeEach(() => {
  vi.clearAllMocks();
  // server.ts's top-level code registers real listeners on the real
  // `process` object on every import — without this, listeners pile up
  // across tests/imports and each earlier test's shutdown() fires again
  // on the next emit.
  process.removeAllListeners("SIGTERM");
  process.removeAllListeners("SIGINT");
});

afterEach(() => {
  process.removeAllListeners("SIGTERM");
  process.removeAllListeners("SIGINT");
});

describe("server bootstrap", () => {
  it("starts listening on the configured port", async () => {
    vi.resetModules();
    await import("./server.js");

    expect(listenMock).toHaveBeenCalledWith(4001, expect.any(Function));
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining("Server running on"));
  });
});

describe("graceful shutdown", () => {
  it("on SIGTERM: closes the server, disconnects Prisma, then exits 0", async () => {
    vi.resetModules();
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);

    await import("./server.js");
    process.emit("SIGTERM");
    await flush();

    expect(fakeServer.close).toHaveBeenCalledOnce();
    expect(prisma.$disconnect).toHaveBeenCalledOnce();
    expect(exitSpy).toHaveBeenCalledWith(0);

    exitSpy.mockRestore();
  });

  it("on SIGINT: also closes the server, disconnects Prisma, then exits 0", async () => {
    vi.resetModules();
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => undefined as never);

    await import("./server.js");
    process.emit("SIGINT");
    await flush();

    expect(fakeServer.close).toHaveBeenCalledOnce();
    expect(prisma.$disconnect).toHaveBeenCalledOnce();
    expect(exitSpy).toHaveBeenCalledWith(0);

    exitSpy.mockRestore();
  });

  it("disconnects Prisma before exiting, not after (avoids dangling connections on redeploy)", async () => {
    vi.resetModules();
    const callOrder: string[] = [];
    vi.mocked(prisma.$disconnect).mockImplementation(async () => {
      callOrder.push("disconnect");
    });
    const exitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      callOrder.push("exit");
      return undefined as never;
    });

    await import("./server.js");
    process.emit("SIGTERM");
    await flush();

    expect(callOrder).toEqual(["disconnect", "exit"]);

    exitSpy.mockRestore();
  });
});
