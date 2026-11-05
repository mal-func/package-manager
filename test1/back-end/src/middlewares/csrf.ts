import type { NextFunction, Request, Response } from "express";

import { CSRF_COOKIE, CSRF_HEADER } from "../lib/cookies.js";
import { ForbiddenError } from "../errors/index.js";

/**
 * Double-submit cookie CSRF check. A cross-site attacker can trigger a
 * request that carries the victim's cookies automatically, but they
 * cannot read the csrf_token cookie's value (Same-Origin Policy) to also
 * set it as a header — so a header/cookie mismatch means the request
 * didn't originate from JS running on our own frontend origin.
 *
 * Only applied to authenticated, state-changing routes (refresh,
 * logout) — login/register have no prior session to ride and are the
 * endpoints that hand out this cookie in the first place.
 */
export function requireCsrfToken(req: Request, _res: Response, next: NextFunction): void {
  const cookieValue = req.cookies?.[CSRF_COOKIE] as string | undefined;
  const headerValue = req.header(CSRF_HEADER);

  if (!cookieValue || !headerValue || cookieValue !== headerValue) {
    next(new ForbiddenError("Missing or invalid CSRF token."));
    return;
  }

  next();
}
