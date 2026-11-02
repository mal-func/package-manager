import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../lib/logger.js", () => ({
  logger: {
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

const { logger } = await import("../lib/logger.js");
const { errorHandler } = await import("./errorHandler.js");
const { ValidationError } = await import("../errors/index.js");

import { createMockResponse } from "../test-utils/expressMocks.js";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("errorHandler", () => {
  it("reports an AppError's real status/code/message to the client and logs at warn level", () => {
    const res = createMockResponse();
    const error = new ValidationError("Email is required.");

    errorHandler(error, {} as never, res, vi.fn() as never);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: "VALIDATION_ERROR", message: "Email is required." },
    });
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({ err: error, code: "VALIDATION_ERROR" }),
      "Email is required.",
    );
    expect(logger.error).not.toHaveBeenCalled();
  });

  it("hides an unexpected error's real message from the client, but logs it at error level", () => {
    const res = createMockResponse();
    const error = new Error("leaked internal detail: db connection string");

    errorHandler(error, {} as never, res, vi.fn() as never);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again later." },
    });
    expect(logger.error).toHaveBeenCalledWith({ err: error }, "Unhandled error");
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("treats a non-Error rejection the same as an unexpected error", () => {
    const res = createMockResponse();

    errorHandler("a rejected string, not an Error object", {} as never, res, vi.fn() as never);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(logger.error).toHaveBeenCalled();
  });
});
