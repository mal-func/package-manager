import { describe, expect, it, vi } from "vitest";

import { logger } from "./logger";

describe("logger", () => {
  it("info forwards to console.info", () => {
    const spy = vi.spyOn(console, "info").mockImplementation(() => {});

    logger.info("hello", { a: 1 });

    expect(spy).toHaveBeenCalledWith("hello", { a: 1 });
    spy.mockRestore();
  });

  it("warn forwards to console.warn", () => {
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});

    logger.warn("careful");

    expect(spy).toHaveBeenCalledWith("careful");
    spy.mockRestore();
  });

  it("error forwards to console.error", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    logger.error("boom");

    expect(spy).toHaveBeenCalledWith("boom");
    spy.mockRestore();
  });
});
