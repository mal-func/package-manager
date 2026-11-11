import { PrismaMariaDb } from "@prisma/adapter-mariadb";

import { PrismaClient } from "../../generated/prisma/client.js";

/**
 * Builds a PrismaClient over the MariaDB driver adapter for the given
 * connection string.
 *
 * Deliberately imports no app config: lib/prisma.ts passes the app's
 * validated env.databaseUrl, while prisma/seed.ts passes the seed's own
 * (config/seedEnv.ts) — so seeding never requires PORT, JWT secrets, or
 * anything else only the HTTP server needs.
 */
export function createPrismaClient(databaseUrl: string): PrismaClient {
  return new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) });
}
