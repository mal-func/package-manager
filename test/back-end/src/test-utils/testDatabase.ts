/**
 * The integration-test database — `cdis_test` on the local dev MySQL
 * (deployment/compose/compose.dev.yaml, which creates it) and on CI's
 * service container. Shared by vitest.integration.config.ts and
 * prisma/prepare-test-database.ts so the two can never point at
 * different databases.
 */
//
// allowPublicKeyRetrieval=true: MySQL 8's default caching_sha2_password
// needs it (or TLS) for a full login over plain TCP, which happens
// whenever the server's auth cache is cold — e.g. right after the MySQL
// container restarts. Without it the connection hangs and every
// integration file times out in beforeAll. Same reasoning as the
// comment in .env.example.
export const TEST_DATABASE_URL = "mysql://cdis:cdis_dev_password@localhost:3308/cdis_test?allowPublicKeyRetrieval=true";
