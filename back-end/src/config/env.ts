/**
 * Backend Configuration Platform — environment loading and validation.
 *
 * Mirrors the frontend's Configuration Platform (see ADR-014): every
 * layer reads config through this module, never through `process.env`
 * directly, and the app refuses to start if required variables are
 * missing or invalid (fail fast).
 */

export type AppEnvironment = "development" | "test" | "staging" | "production";

const VALID_ENVIRONMENTS: AppEnvironment[] = [
  "development",
  "test",
  "staging",
  "production",
];

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`[Configuration Error] Missing required environment variable: ${name}`);
  }

  return value;
}

function requirePort(name: string): number {
  const raw = requireEnv(name);
  const parsed = Number(raw);

  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > 65535) {
    throw new Error(`[Configuration Error] Invalid ${name}: "${raw}" is not a valid port number`);
  }

  return parsed;
}

function requirePositiveInt(name: string): number {
  const raw = requireEnv(name);
  const parsed = Number(raw);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`[Configuration Error] Invalid ${name}: "${raw}" must be a positive integer`);
  }

  return parsed;
}

function requireNonNegativeInt(name: string): number {
  const raw = requireEnv(name);
  const parsed = Number(raw);

  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new Error(`[Configuration Error] Invalid ${name}: "${raw}" must be a non-negative integer`);
  }

  return parsed;
}

function requireBoolean(name: string): boolean {
  const raw = requireEnv(name);

  // Exactly "true"/"false" — no "1"/"yes"/"on" guessing, so a typo
  // fails at startup instead of silently meaning false.
  if (raw !== "true" && raw !== "false") {
    throw new Error(`[Configuration Error] Invalid ${name}: "${raw}" must be "true" or "false"`);
  }

  return raw === "true";
}

const nodeEnv = process.env["NODE_ENV"] ?? "development";

if (!VALID_ENVIRONMENTS.includes(nodeEnv as AppEnvironment)) {
  throw new Error(
    `[Configuration Error] Invalid NODE_ENV: "${nodeEnv}". Valid values are: ${VALID_ENVIRONMENTS.join(", ")}`,
  );
}

export const env = {
  nodeEnv: nodeEnv as AppEnvironment,
  port: requirePort("PORT"),
  corsOrigin: requireEnv("CORS_ORIGIN"),
  databaseUrl: requireEnv("DATABASE_URL"),
  /**
   * How many reverse proxies sit between the client and this process.
   * 0 when the backend is hit directly (local dev); 1 behind the
   * deployment/ Apache proxy. Too low and every client shares the
   * proxy's IP (one rate-limit bucket for everyone); too high and a
   * client can spoof its IP via X-Forwarded-For.
   */
  trustProxyHops: requireNonNegativeInt("TRUST_PROXY_HOPS"),

  auth: {
    jwtAccessSecret: requireEnv("JWT_ACCESS_SECRET"),
    jwtAccessExpiresIn: requireEnv("JWT_ACCESS_EXPIRES_IN"),
    refreshTokenExpiresInDays: requirePositiveInt("REFRESH_TOKEN_EXPIRES_IN_DAYS"),
    bcryptSaltRounds: requirePositiveInt("BCRYPT_SALT_ROUNDS"),
    lockoutMaxAttempts: requirePositiveInt("ACCOUNT_LOCKOUT_MAX_ATTEMPTS"),
    lockoutDurationMinutes: requirePositiveInt("ACCOUNT_LOCKOUT_DURATION_MINUTES"),
    /**
     * Whether anyone can create their own account via POST /auth/register
     * (always with the plain "user" role). Off = accounts come only from
     * the seeded initial admin; see docs/architecture/authorization.md.
     */
    allowSelfRegistration: requireBoolean("ALLOW_SELF_REGISTRATION"),
  },
} as const;
