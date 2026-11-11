import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { pinoHttp } from "pino-http";

import { env } from "./config/index.js";
import { logger } from "./lib/logger.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import { notFoundHandler } from "./middlewares/notFoundHandler.js";
import { apiV1Router } from "./routes/index.js";
import { healthRouter } from "./routes/health.routes.js";

export function createApp() {
  const app = express();

  // Derive req.ip from X-Forwarded-For only for the configured number of
  // trusted proxy hops (Express "trust proxy" docs). Everything that keys
  // on req.ip (both rate limiters, refresh-token createdByIp) depends on it.
  app.set("trust proxy", env.trustProxyHops);

  // Security headers (OWASP Secure Headers Cheat Sheet baseline).
  app.use(helmet());

  // Cross-origin access is limited to the configured frontend origin,
  // with credentials enabled since authentication uses httpOnly cookies.
  app.use(
    cors({
      origin: env.corsOrigin,
      credentials: true,
    }),
  );

  app.use(compression());
  app.use(cookieParser());
  app.use(express.json());
  app.use(pinoHttp({ logger }));

  // Baseline rate limit for all routes. Sensitive routes (e.g. login)
  // get a stricter, purpose-specific limiter layered on top when they're
  // built — this one just protects against blunt-force abuse globally.
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      limit: 100,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.use("/health", healthRouter);
  app.use("/api/v1", apiV1Router);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
