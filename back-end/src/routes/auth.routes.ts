import { Router } from "express";

import { login, logout, me, options, refresh, register } from "../controllers/auth.controller.js";
import { loginSchema, registerSchema } from "../data-transfer-object/auth.dto.js";
import { requireCsrfToken } from "../middlewares/csrf.js";
import { loginRateLimiter } from "../middlewares/rateLimiters.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { validateBody } from "../middlewares/validate.js";

export const authRouter = Router();

authRouter.post("/register", validateBody(registerSchema), register);
authRouter.post("/login", loginRateLimiter, validateBody(loginSchema), login);
authRouter.post("/refresh", requireCsrfToken, refresh);
authRouter.post("/logout", requireAuth, requireCsrfToken, logout);
authRouter.get("/me", requireAuth, me);
// Public on purpose: the login page asks this before anyone is signed in.
authRouter.get("/options", options);
