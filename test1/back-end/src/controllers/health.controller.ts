import type { Request, Response } from "express";

import { prisma } from "../lib/prisma.js";
import { sendSuccess } from "../utils/apiResponse.js";

/**
 * Liveness + readiness check. Verifies the process is up AND that the
 * database is actually reachable, so this can be wired into container
 * orchestration health checks (Docker/Kubernetes) as a real readiness
 * probe, not just a "the process didn't crash" ping.
 *
 * Express 5 forwards rejected promises to the error middleware
 * automatically, so no try/catch or asyncHandler wrapper is needed here.
 */
export async function getHealth(_req: Request, res: Response): Promise<void> {
  await prisma.$queryRaw`SELECT 1`;

  sendSuccess(res, {
    status: "ok",
    uptimeSeconds: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
}
