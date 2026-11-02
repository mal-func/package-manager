import { afterEach, describe, expect, it, vi } from "vitest";

async function importFresh() {
  vi.resetModules();
  return import("./logger.js");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("logger", () => {
  it("is silent in the test environment (the baseline NODE_ENV for this suite)", async () => {
    const { logger } = await importFresh();

    expect(logger.level).toBe("silent");
  });

  it("logs at info level in production", async () => {
    vi.stubEnv("NODE_ENV", "production");

    const { logger } = await importFresh();

    expect(logger.level).toBe("info");
  });

  it("logs at debug level, with pretty-printing, in development", async () => {
    vi.stubEnv("NODE_ENV", "development");

    const { logger } = await importFresh();

    expect(logger.level).toBe("debug");
  });

  // pino writes via sonic-boom directly to the fd, bypassing
  // process.stdout.write, so interception has to happen at the stream
  // pino actually uses: pass one in for just these assertions, built
  // from the real exported redactConfig — not a hand-duplicated copy —
  // so a future edit to the source can't silently drift from the test.
  async function loggerWithCapturedOutput() {
    const pino = (await import("pino")).default;
    const { redactConfig } = await importFresh();
    let written = "";
    const testLogger = pino({ redact: redactConfig }, { write: (chunk: string) => { written += chunk; } });
    return { testLogger, getWritten: () => written };
  }

  it("redacts a nested credential field (e.g. `user.password`) from the emitted log line", async () => {
    const { testLogger, getWritten } = await loggerWithCapturedOutput();

    testLogger.info({ user: { password: "super-secret", email: "test@example.com" } }, "login attempt");

    expect(getWritten()).toContain("[REDACTED]");
    expect(getWritten()).not.toContain("super-secret");
    expect(getWritten()).toContain("test@example.com");
  });

  it("also redacts a credential field logged at the top level, not just nested (e.g. logger.info(req.body, ...))", async () => {
    const { testLogger, getWritten } = await loggerWithCapturedOutput();

    testLogger.info({ password: "super-secret", refreshToken: "raw-token-value", email: "test@example.com" }, "example");

    expect(getWritten()).not.toContain("super-secret");
    expect(getWritten()).not.toContain("raw-token-value");
    expect(getWritten()).toContain("test@example.com");
  });
});
