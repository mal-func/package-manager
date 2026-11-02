import rateLimit from "express-rate-limit";

/**
 * Stricter than the global baseline limiter (Milestone 2) — login is
 * the specific endpoint brute-force protection needs to target.
 * Keyed by IP + attempted email so one attacker can't lock out a
 * legitimate user by hammering their email from many IPs, and one IP
 * can't be used to spray many accounts unnoticed either.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const email = typeof req.body?.email === "string" ? req.body.email.toLowerCase() : "unknown";
    return `${req.ip}:${email}`;
  },
});
