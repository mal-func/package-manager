import type { Request, Response } from "express";

import { sendError } from "../utils/apiResponse.js";

/**
 * Registered after all routes; catches any request that matched no route.
 */
export function notFoundHandler(req: Request, res: Response): void {
  sendError(res, 404, "ROUTE_NOT_FOUND", `No route found for ${req.method} ${req.originalUrl}`);
}
