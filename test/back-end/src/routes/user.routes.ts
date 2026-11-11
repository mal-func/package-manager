import { Router } from "express";

import { listUsers, setUserRoles } from "../controllers/user.controller.js";
import { paginationQuerySchema } from "../data-transfer-object/pagination.dto.js";
import { setUserRolesSchema } from "../data-transfer-object/user.dto.js";
import { requireCsrfToken } from "../middlewares/csrf.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requirePermission } from "../middlewares/requirePermission.js";
import { validateBody, validateQuery } from "../middlewares/validate.js";

export const userRouter = Router();

userRouter.get("/", requireAuth, requirePermission("users:read"), validateQuery(paginationQuerySchema), listUsers);

// State-changing and cookie-authenticated, so CSRF-checked like
// /auth/refresh and /auth/logout (see middlewares/csrf.ts).
userRouter.put(
  "/:id/roles",
  requireAuth,
  requireCsrfToken,
  requirePermission("roles:manage"),
  validateBody(setUserRolesSchema),
  setUserRoles,
);
