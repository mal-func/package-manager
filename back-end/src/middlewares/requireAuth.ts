import type { NextFunction, Request, Response } from "express";

import { UnauthorizedError } from "../errors/index.js";
import { ACCESS_TOKEN_COOKIE } from "../lib/cookies.js";
import { authService } from "../services/auth.service.js";
import { tokenService } from "../services/token.service.js";

/**
 * Verifies the access token cookie and loads the authenticated user,
 * attaching both req.userId and req.user. Authorization guards
 * (requirePermission) build on top of req.user.
 *
 * A valid JWT signature only proves a token was genuinely issued at
 * some point — it says nothing about whether the account it names
 * still exists. Re-checking the DB here means an account deleted (or
 * soft-deleted) mid-token-lifetime is rejected on *every*
 * requireAuth-protected route, not only ones that happen to also run
 * requirePermission — a valid-looking token for a vanished account is
 * treated the same as no token at all, everywhere, consistently.
 */
export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const token = req.cookies?.[ACCESS_TOKEN_COOKIE] as string | undefined;

  if (!token) {
    next(new UnauthorizedError("Authentication is required."));
    return;
  }

  let userId: string;

  try {
    userId = tokenService.verifyAccessToken(token).sub;
  } catch {
    next(new UnauthorizedError("Your session is invalid or has expired."));
    return;
  }

  try {
    req.user = await authService.getCurrentUser(userId);
    req.userId = userId;
    next();
  } catch {
    // Same generic message as an invalid token — whether the token
    // itself is bad or the account behind it is gone, the caller
    // can't tell the difference, so this can't be used to enumerate
    // which accounts exist.
    next(new UnauthorizedError("Your session is invalid or has expired."));
  }
}
