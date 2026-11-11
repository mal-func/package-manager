import type { Request, Response } from "express";

import { roleService } from "../services/role.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export async function listRoles(_req: Request, res: Response): Promise<void> {
  sendSuccess(res, { roles: await roleService.list() });
}
