import type { NextFunction, Request, Response } from "express";

import { AppError } from "../errors/index.js";
import { logger } from "../lib/logger.js";
import { sendError } from "../utils/apiResponse.js";

/**
 * Centralized error-handling middleware. Must be registered last, after
 * all routes.
 *
 * Operational errors (AppError subclasses) are reported to the client
 * with their real message. Anything else is treated as an unexpected
 * programming error: logged in full server-side, but the client only
 * ever sees a generic message — per OWASP's guidance against leaking
 * stack traces or internal details in error responses.
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    logger.warn({ err, code: err.code }, err.message);
    sendError(res, err.statusCode, err.code, err.message);
    return;
  }

  logger.error({ err }, "Unhandled error");
  sendError(res, 500, "INTERNAL_ERROR", "Something went wrong. Please try again later.");
}
