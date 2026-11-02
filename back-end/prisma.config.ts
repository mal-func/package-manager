import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    // No --env-file: `dotenv/config` above already loads a local .env
    // into this process, and the seed inherits it. In a container there
    // is no .env at all — the real environment is used as-is.
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
