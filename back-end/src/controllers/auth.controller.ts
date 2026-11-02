import type { Request, Response } from "express";

import type { LoginInput, RegisterInput } from "../data-transfer-object/auth.dto.js";
import { UnauthorizedError } from "../errors/index.js";
import { clearAuthCookies, REFRESH_TOKEN_COOKIE, setAuthCookies } from "../lib/cookies.js";
import { authService } from "../services/auth.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

function requestContext(req: Request) {
  return { ip: req.ip, userAgent: req.header("user-agent") };
}

export async function register(req: Request, res: Response): Promise<void> {
  const result = await authService.register(req.body as RegisterInput, requestContext(req));
  setAuthCookies(res, result);
  sendSuccess(res, { user: result.user }, 201);
}

export async function login(req: Request, res: Response): Promise<void> {
  const result = await authService.login(req.body as LoginInput, requestContext(req));
  setAuthCookies(res, result);
  sendSuccess(res, { user: result.user });
}

export async function refresh(req: Request, res: Response): Promise<void> {
  const rawToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;

  if (!rawToken) {
    throw new UnauthorizedError("No session found.");
  }

  const result = await authService.refresh(rawToken, requestContext(req));
  setAuthCookies(res, result);
  sendSuccess(res, { user: result.user });
}

export async function logout(req: Request, res: Response): Promise<void> {
  const rawToken = req.cookies?.[REFRESH_TOKEN_COOKIE] as string | undefined;

  if (rawToken) {
    await authService.logout(rawToken);
  }

  clearAuthCookies(res);
  sendSuccess(res, { message: "Logged out successfully." });
}

export function options(_req: Request, res: Response): void {
  sendSuccess(res, authService.getOptions());
}

export function me(req: Request, res: Response): void {
  // req.user is guaranteed set here — requireAuth already loaded (and
  // existence-verified) it. No second DB round-trip needed.
  sendSuccess(res, { user: req.user! });
}
