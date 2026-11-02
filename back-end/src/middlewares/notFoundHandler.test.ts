import { describe, expect, it } from "vitest";

import { createMockRequest, createMockResponse } from "../test-utils/expressMocks.js";
import { notFoundHandler } from "./notFoundHandler.js";

describe("notFoundHandler", () => {
  it("responds 404 with the method and originalUrl that matched no route", () => {
    const req = createMockRequest({ method: "POST", originalUrl: "/api/v1/nope" });
    const res = createMockResponse();

    notFoundHandler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      error: { code: "ROUTE_NOT_FOUND", message: "No route found for POST /api/v1/nope" },
    });
  });
});
