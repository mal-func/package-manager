import type { PrismaClient } from "../../generated/prisma/client.js";
import { env } from "../config/index.js";
import { createPrismaClient } from "./prismaClientFactory.js";

/**
 * Prisma Client singleton.
 *
 * Stored on `globalThis` in non-production environments so that `tsx watch`
 * hot reloads reuse the same client instead of opening a new connection
 * pool on every file change (a well-known Prisma + hot-reload pitfall).
 */

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

export const prisma = globalForPrisma.prisma ?? createPrismaClient(env.databaseUrl);

if (env.nodeEnv !== "production") {
  globalForPrisma.prisma = prisma;
}
