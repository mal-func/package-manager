import { defineConfig } from "vitest/config";

import { TEST_DATABASE_URL } from "./src/test-utils/testDatabase.js";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.integration.test.ts"],
    // Integration tests hit the real MySQL container (Milestone 1) via
    // a dedicated cdis_test database — never the dev database, so a
    // test run can never clobber data a developer is looking at.
    env: {
      NODE_ENV: "test",
      PORT: "4001",
      CORS_ORIGIN: "http://localhost:5173",
      DATABASE_URL: TEST_DATABASE_URL,
      JWT_ACCESS_SECRET: "test-only-secret-never-used-outside-the-test-suite",
      JWT_ACCESS_EXPIRES_IN: "15m",
      REFRESH_TOKEN_EXPIRES_IN_DAYS: "7",
      BCRYPT_SALT_ROUNDS: "4",
      ACCOUNT_LOCKOUT_MAX_ATTEMPTS: "5",
      ACCOUNT_LOCKOUT_DURATION_MINUTES: "15",
      TRUST_PROXY_HOPS: "0",
      ALLOW_SELF_REGISTRATION: "true",
    },
    // Integration tests share one DB connection pool and can't safely
    // run in parallel worker processes against the same rows.
    fileParallelism: false,
  },
});
