import "express";

import type { SafeUser } from "../mappers/user.mapper.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      /** Populated (and cached) by requirePermission on first use per request. */
      user?: SafeUser;
      /**
       * Populated by validateQuery(schema) with the parsed/coerced
       * result — not written back onto `query` itself, since Express's
       * own ReqQuery type only allows string(-array) values, not the
       * numbers/booleans a query schema typically coerces to.
       */
      validatedQuery?: unknown;
    }
  }
}
