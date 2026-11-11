import type { Request, Response } from "express";

import type { PaginationQuery } from "../data-transfer-object/pagination.dto.js";
import type { SetUserRolesInput } from "../data-transfer-object/user.dto.js";
import { userService } from "../services/user.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export async function listUsers(req: Request, res: Response): Promise<void> {
  // validateQuery(paginationQuerySchema) has already run — see user.routes.ts.
  const { limit, offset } = req.validatedQuery as PaginationQuery;
  const { users, total } = await userService.list({ limit, offset });

  sendSuccess(res, { users, pagination: { limit, offset, total } });
}

export async function setUserRoles(req: Request, res: Response): Promise<void> {
  // requireAuth has set req.userId; validateBody(setUserRolesSchema) has
  // already parsed and de-duplicated the body — see user.routes.ts.
  const { roles } = req.body as SetUserRolesInput;
  const user = await userService.setRoles(req.userId!, String(req.params["id"]), roles);

  sendSuccess(res, { user });
}
