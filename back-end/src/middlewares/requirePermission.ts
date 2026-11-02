import type { NextFunction, Request, Response } from "express";

import { ForbiddenError, UnauthorizedError } from "../errors/index.js";

/**
 * Authorization guard: requires the authenticated user to hold at least
 * one of the given permissions. Always checks permissions, never role
 * names — see the hybrid RBAC decision this project is built on.
 *
 * Must run after requireAuth, which loads the user (existence and all)
 * onto req.user — this guard trusts that and only checks permissions.
 */
export function requirePermission(permission: string | string[]) {
  const required = Array.isArray(permission) ? permission : [permission];

  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError("Authentication is required."));
      return;
    }

    const hasPermission = required.some((needed) => req.user!.permissions.includes(needed));

    if (!hasPermission) {
      next(new ForbiddenError("You do not have permission to perform this action."));
      return;
    }

    next();
  };
}
