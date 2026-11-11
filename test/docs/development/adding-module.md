# Adding a Module

A "module" here means a new backend resource from scratch — the full layered stack, not just one endpoint (see [Adding an API](adding-api.md) for that).

---

## Purpose

Steps to introduce a new resource (e.g. a Prisma model + its full CRUD surface), following the `users` resource as the reference.

---

## Location

All layers live at the top level of `back-end/src/`, one file per resource per layer — there are no domain subfolders (see [Project Structure](../architecture/project-structure.md)).

---

## Workflow

```
1. schema.prisma        → new model (if it needs its own table)
2. repositories/        → <resource>.repository.ts — all Prisma calls for it
3. services/            → <resource>.service.ts — business logic, calls the repository
4. dto/                 → <resource>.dto.ts — Zod schemas for its request bodies
5. controllers/         → <resource>.controller.ts — one function per endpoint
6. routes/               → <resource>.routes.ts — wires guards + validation + controller
7. routes/index.ts       → mount the new router under /api/v1
```

Reference implementation: `user.repository.ts` → `user.service.ts` → `user.controller.ts` → `user.routes.ts`, mounted in `routes/index.ts`.

---

## Common Tasks

| Step | File |
|---|---|
| New table | `prisma/schema.prisma`, then `npm run prisma:migrate` |
| Data access | `repositories/<resource>.repository.ts` |
| Business rules | `services/<resource>.service.ts` |
| Request validation | `data-transfer-object/<resource>.dto.ts` |
| HTTP handlers | `controllers/<resource>.controller.ts` |
| Route + guards | `routes/<resource>.routes.ts`, mount in `routes/index.ts` |
| Restrict by permission | add the permission key to `prisma/seed.ts`, apply `requirePermission("key")` in the route |
| Expose it to the frontend | new feature — see [Adding a Feature](adding-feature.md) |

---

## Related Documents

- [Adding an API](adding-api.md)
- [Database Standards](../standards/database.md)
- [Authorization](../architecture/authorization.md)

---

## References

- [Prisma Documentation](https://www.prisma.io/docs)
