import { describe, expect, it } from "vitest";

import { createMockResponse } from "../test-utils/expressMocks.js";
import { sendError, sendSuccess } from "./apiResponse.js";

describe("sendSuccess", () => {
  it("defaults to a 200 status with a success envelope", () => {
    const res = createMockResponse();

    sendSuccess(res, { user: { id: "u1" } });

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { user: { id: "u1" } } });
  });

  it("uses the given status code when one is provided", () => {
    const res = createMockResponse();

    sendSuccess(res, { user: { id: "u1" } }, 201);

    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe("sendError", () => {
  it("responds with the given status, code, and message in a failure envelope", () => {
    const res = createMockResponse();

    sendError(res, 404, "NOT_FOUND", "The requested resource could not be found.");

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: "NOT_FOUND", message: "The requested resource could not be found." },
    });
  });
});
