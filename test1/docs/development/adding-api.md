# Adding an API Endpoint

Adding one new endpoint to an existing backend resource, and consuming it from the frontend.

---

## Purpose

The layer-by-layer steps for a new endpoint — not a new resource from scratch (see [Adding a Module](adding-module.md) for that).

---

## Location

- `back-end/src/routes/<resource>.routes.ts`
- `back-end/src/controllers/<resource>.controller.ts`
- `back-end/src/services/<resource>.service.ts`
- `back-end/src/data-transfer-object/<resource>.dto.ts` (if the endpoint takes a body)
- `front-end/src/features/<feature>/api/<feature>Api.ts`

---

## Workflow

```
route (+ requireAuth / requirePermission / validateBody as needed)
  → controller (reads req, calls service, sendSuccess/sendError)
  → service (business logic)
  → repository (Prisma query, if data access is needed)
```
Reference: `GET /api/v1/users` — `user.routes.ts` → `listUsers` in `user.controller.ts` → `userService` → `userRepository`.

---

## Common Tasks

| Step | File |
|---|---|
| 1. Define the route + guards | `<resource>.routes.ts` |
| 2. Add the controller function | `<resource>.controller.ts` — call `sendSuccess(res, data, statusCode)` |
| 3. Add the service method | `<resource>.service.ts` |
| 4. Add a repository method if needed | `repositories/<resource>.repository.ts` |
| 5. Validate the body, if any | Zod schema in `data-transfer-object/<resource>.dto.ts`, `validateBody(schema)` in the route |
| 6. Call it from the frontend | add a method to `features/<feature>/api/<feature>Api.ts` using `apiClient.get/post/put/patch/delete` |

---

## Related Documents

- [API Standards](../standards/api.md)
- [Adding a Module](adding-module.md)
- [Adding a Feature](adding-feature.md)

---

## References

- [Express Documentation](https://expressjs.com/)
