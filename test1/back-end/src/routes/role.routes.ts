import { Router } from "express";

import { listRoles } from "../controllers/role.controller.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { requirePermission } from "../middlewares/requirePermission.js";

export const roleRouter = Router();

roleRouter.get("/", requireAuth, requirePermission("roles:manage"), listRoles);
