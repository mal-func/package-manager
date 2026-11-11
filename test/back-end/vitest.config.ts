import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    exclude: ["**/node_modules/**", "src/**/*.integration.test.ts"],
    env: {
      NODE_ENV: "test",
      PORT: "4001",
      CORS_ORIGIN: "http://localhost:5173",
      DATABASE_URL: "mysql://test:test@localhost:3308/test_unused",
      JWT_ACCESS_SECRET: "test-only-secret-never-used-outside-the-test-suite",
      JWT_ACCESS_EXPIRES_IN: "15m",
      REFRESH_TOKEN_EXPIRES_IN_DAYS: "7",
      // Lower than production (12) deliberately — cost factor doesn't
      // change correctness, only brute-force resistance, so this is a
      // standard, well-reasoned speed-up for a test suite that runs
      // bcrypt hundreds of times.
      BCRYPT_SALT_ROUNDS: "4",
      ACCOUNT_LOCKOUT_MAX_ATTEMPTS: "5",
      ACCOUNT_LOCKOUT_DURATION_MINUTES: "15",
      TRUST_PROXY_HOPS: "0",
      ALLOW_SELF_REGISTRATION: "true",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/**/*.test.ts", "src/types/**", "src/test-utils/**"],
      thresholds: {
        // Global floor. Security-critical modules carry a higher bar —
        // see the per-glob thresholds below.
        lines: 85,
        statements: 85,
        functions: 85,
        branches: 80,

        "src/services/auth.service.ts": { lines: 95, statements: 95, functions: 95, branches: 90 },
        "src/services/token.service.ts": { lines: 95, statements: 95, functions: 95, branches: 90 },
        "src/middlewares/requireAuth.ts": { lines: 95, statements: 95, functions: 95, branches: 90 },
        "src/middlewares/requirePermission.ts": { lines: 95, statements: 95, functions: 95, branches: 90 },
        "src/middlewares/csrf.ts": { lines: 95, statements: 95, functions: 95, branches: 90 },
        "src/lib/cookies.ts": { lines: 95, statements: 95, functions: 95, branches: 90 },
      },
    },
  },
});
