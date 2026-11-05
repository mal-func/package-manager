import pino from "pino";

import { env } from "../config/index.js";

/**
 * Fields that must never reach log output (OWASP Logging Cheat Sheet:
 * never log credentials, tokens, or auth headers/cookies). Both the
 * bare key and the "*." wildcard are listed for each field — the
 * wildcard only matches one level under some parent key, so a field
 * logged at the top level of an object (e.g. `logger.info(req.body,
 * ...)`) needs the bare key to be caught too. Exported so tests can
 * exercise the real config instead of a hand-duplicated copy.
 */
export const redactConfig = {
  paths: [
    "req.headers.authorization",
    "req.headers.cookie",
    "res.headers['set-cookie']",
    "password",
    "*.password",
    "passwordHash",
    "*.passwordHash",
    "accessToken",
    "*.accessToken",
    "refreshToken",
    "*.refreshToken",
    "token",
    "*.token",
  ],
  censor: "[REDACTED]",
};

/** Structured application logger. */
export const logger = pino({
  // Test runs exercise every error path deliberately (401s, 403s, locked
  // accounts, etc.) — logging each one is noise, not signal, and floods
  // test output. Silent in test, debug locally, info in production.
  level: env.nodeEnv === "test" ? "silent" : env.nodeEnv === "production" ? "info" : "debug",
  redact: redactConfig,
  transport:
    env.nodeEnv === "development"
      ? { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss", ignore: "pid,hostname" } }
      : undefined,
});
