import { createApp } from "./app.js";
import { env } from "./config/index.js";
import { logger } from "./lib/logger.js";
import { prisma } from "./lib/prisma.js";

const app = createApp();

const server = app.listen(env.port, () => {
  logger.info(`Server running on http://localhost:${env.port} [${env.nodeEnv}]`);
});

/**
 * Graceful shutdown: stop accepting new connections, let in-flight
 * requests finish, then close the database connection pool before
 * exiting. Without this, a SIGTERM (e.g. during a container redeploy)
 * kills in-flight requests and leaves DB connections dangling.
 */
async function shutdown(signal: string): Promise<void> {
  logger.info(`${signal} received, shutting down gracefully`);

  server.close(async () => {
    await prisma.$disconnect();
    logger.info("Shutdown complete");
    process.exit(0);
  });
}

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
