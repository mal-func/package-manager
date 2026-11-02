# Adding a Database Change

Adding or changing a Prisma model — a new field, a new table, a new relation.

---

## Purpose

The real sequence from editing the schema to a field actually being usable end to end, including what CI and production do differently from local dev.

---

## Location

- `back-end/prisma/schema.prisma` — the schema itself
- `back-end/prisma/migrations/` — generated migration SQL, committed to git
- `back-end/prisma/seed.ts` — reference/demo data
- `back-end/src/repositories/<resource>.repository.ts` — where the new field/model is actually queried

---

## Workflow

```
edit schema.prisma
  → generate + apply a migration (local dev only)
  → regenerate the Prisma Client
  → use the new field in a repository method
  → update seed.ts if the field needs demo/reference data
```

Locally, `prisma migrate dev` does two things at once: writes a new SQL migration file under `prisma/migrations/`, and applies it to your dev database. In CI and production, only `prisma migrate deploy` runs — it applies already-generated migrations, it never generates new ones. This means the migration file has to already exist and be committed *before* it reaches CI; there's no "generate the migration in production" path.

**Production applies it before the new code serves traffic** (`deployment/scripts/deploy.sh` runs the new image's migrations first, while the old version is still running). So a migration must work with *both* the old and the new code:

- adding a nullable column or a new table: fine in one release;
- renaming or dropping a column the running code uses: two releases — add the new column and write to both first, remove the old one in a later release;
- `NOT NULL` without a default on an existing table: add it nullable, backfill, then tighten in a later release.

MySQL can't roll back DDL, so a migration that fails halfway leaves its earlier statements applied, and Prisma blocks further deploys until it's resolved — see [Deployment Standards](../standards/deployment.md). One statement per migration where practical keeps that recoverable.

---

## Common Tasks

| Step | Command / File |
|---|---|
| 1. Edit the schema | `back-end/prisma/schema.prisma` |
| 2. Generate + apply the migration | `cd back-end && npm run prisma:migrate -- --name <short-description>` |
| 3. Regenerate the Prisma Client | happens automatically as part of step 2; run `npm run prisma:generate` by hand if you ever need to re-sync it without a schema change |
| 4. Use the field | add/update a method in `repositories/<resource>.repository.ts` |
| 5. Add reference/demo data, if needed | `back-end/prisma/seed.ts`, then `npm run prisma:seed` |
| 5b. Bring the test database up to date | `npm run db:test:prepare` |
| 6. Commit the migration file | `prisma/migrations/<timestamp>_<name>/migration.sql` — this is real source, not a build artifact; it must be committed |
| Reset your local dev database | `npx prisma migrate reset` (drops and re-applies every migration, then re-seeds — destructive, dev-only) |

---

## Related Documents

- [Database Standards](../standards/database.md)
- [Adding an API Endpoint](adding-api.md)
- [Removing a Feature](removing-a-feature.md)

---

## References

- [Prisma Migrate Documentation](https://www.prisma.io/docs/orm/prisma-migrate)
