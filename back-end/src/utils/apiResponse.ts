import type { Response } from "express";

/**
 * Consistent success response envelope used across every endpoint.
 */
export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  res.status(statusCode).json({
    success: true,
    data,
  });
}

/**
 * Consistent error response envelope used across every endpoint.
 * Never include stack traces or internal details here — see
 * middlewares/errorHandler.ts for what's safe to expose.
 */
export function sendError(
  res: Response,
  statusCode: number,
  code: string,
  message: string,
): void {
  res.status(statusCode).json({
    success: false,
    error: { code, message },
  });
}
