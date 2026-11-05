# Database Standards

MySQL 8 via Prisma 7, accessed only through the repository layer.

---

## Purpose

How the schema, migrations, and data access are organized in this project.

---

## Location

| Piece | File |
|---|---|
| Schema | `back-end/prisma/schema.prisma` |
| Datasource/migration config | `back-end/prisma.config.ts` (Prisma 7 moved this out of the schema file) |
| Client singleton | `back-end/src/lib/prisma.ts` |
| Seed script | `back-end/prisma/seed.ts` (+ `src/seed/initialAdmin.ts`, config `src/config/seedEnv.ts`) |
| Local dev database | `deployment/compose/compose.dev.yaml` — MySQL on `localhost:3308`, databases `cdis` and `cdis_test` |
| Migrations | `back-end/prisma/migrations/` |
| Data access | `back-end/src/repositories/*.repository.ts` — **only** place `prisma.*` is called |

---

## Workflow

```
DATABASE_URL → PrismaMariaDb driver adapter → PrismaClient (lib/prisma.ts)
  ↓
repositories/*.repository.ts   ← the only layer that imports `prisma`
  ↓
services/*.service.ts          ← business logic, no Prisma calls
```

Client is cached on `globalThis` outside production so `tsx watch` hot-reloads reuse one connection pool instead of leaking a new one per file change.

**Schema summary**: `User` (soft-delete via `deletedAt`, lockout fields `failedLoginAttempts`/`lockedUntil`) — `Role` / `Permission` many-to-many via `UserRole` / `RolePermission` — `RefreshToken` (hashed token, `replacedByTokenId` forms a rotation chain) — plus `Demo*` models backing the demo pages. See [Authorization](../architecture/authorization.md) for how roles/permissions are used.

**The seed** needs only `DATABASE_URL` (it builds its own client via `lib/prismaClientFactory.ts`, never the app's config), is idempotent, and runs on every server deploy. It creates an initial admin only when `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` are set.

**Two databases locally**: `cdis` for `npm run dev`, `cdis_test` for integration tests (`TEST_DATABASE_URL` in `src/test-utils/testDatabase.ts`). Tests never touch `cdis`.

**Migrations in production** are applied by `deployment/scripts/deploy.sh` before the new version starts serving — so every migration must be backward-compatible with the version still running (add first, remove in a later release). See [Adding a Database Change](../development/adding-a-db-change.md).

---

## Common Tasks

| Task | Command / File |
|---|---|
| Start the local database | `docker compose -f deployment/compose/compose.dev.yaml up -d --wait` |
| Apply existing migrations | `npx prisma migrate deploy` (dev DB), `npm run db:test:prepare` (test DB) |
| Change the schema | edit `schema.prisma`, then `npm run prisma:migrate -- --name <what>` |
| Regenerate the client after pulling schema changes | `npm run prisma:generate` |
| Re-seed roles/permissions | `npm run prisma:seed` |
| Inspect data | `npm run prisma:studio` |
| Add a query | add a method to the relevant `repositories/*.repository.ts` — never call `prisma` from a service or controller |

---

## Commands

```bash
cd back-end
npm run prisma:migrate    # dev migration
npm run prisma:seed
npm run prisma:studio
```

---

## Related Documents

- [Authorization](../architecture/authorization.md)
- [Environment Standards](environment.md)

---

## References

- [Prisma Documentation](https://www.prisma.io/docs)
- [MySQL 8.0 Reference Manual](https://dev.mysql.com/doc/refman/8.0/en/)
