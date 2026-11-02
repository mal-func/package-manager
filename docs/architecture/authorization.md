# Authorization

Hybrid RBAC: roles assign permissions, but every guard checks permission keys directly.

---

## Purpose

Document how authenticated users are authorized in this repository and where developers should extend permission checks.

---

## Location

| Layer | Files |
|---|---|
| Database schema | `back-end/prisma/schema.prisma` (`Role`, `Permission`, `UserRole`, `RolePermission`) |
| Seeded roles/permissions | `back-end/prisma/seed.ts` |
| Backend route guard | `back-end/src/middlewares/requirePermission.ts` |
| Example protected route | `back-end/src/routes/user.routes.ts` |
| Role assignment API | `back-end/src/routes/{user,role}.routes.ts` → `services/{user,role}.service.ts` |
| Initial admin (seed) | `back-end/src/seed/initialAdmin.ts`, config in `back-end/src/config/seedEnv.ts` |
| Role editor UI | `front-end/src/features/users/components/EditRolesDialog.tsx` |
| Permission helpers | `front-end/src/auth/hooks/usePermission.ts` |
| Route guard | `front-end/src/auth/components/RequirePermission.tsx` |
| UI gate | `front-end/src/auth/components/PermissionGate.tsx` |
| User payload shape | `back-end/src/mappers/user.mapper.ts` |

---

## Workflow

**Backend authorization**

1. `requireAuth` authenticates the request, reloads the user with their roles and permissions from the database, and sets `req.userId` and `req.user`.
2. `requirePermission("users:read")` (or any other key) checks that key against `req.user.permissions` — it must run after `requireAuth`.
3. If the user lacks the required permission, the request returns `403 Forbidden`.

Because permissions come from the database on every request, granting or revoking a role takes effect on the user's very next request — no re-login, nothing cached in the token.

**Seeded roles and permissions** (`back-end/prisma/seed.ts`)

| Role | Permissions |
|---|---|
| `admin` | `users:read`, `users:write`, `roles:manage` |
| `manager` | `users:read` |
| `user` | none — every self-registered account starts here |

`users:write` is seeded for the future "create/edit/deactivate users" feature; no endpoint uses it yet.

**Getting the first admin**

Nobody can grant roles until someone is an admin, so the seed can create one: set `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` (both, or neither) and run the seed — `npm run prisma:seed` locally, or automatically on every server deploy. It creates the account with the `admin` role, or grants `admin` to an existing account with that email. It never changes an existing account's password and refuses a soft-deleted one.

**Assigning roles**

| Endpoint | Guard | Behaviour |
|---|---|---|
| `GET /api/v1/roles` | `roles:manage` | every role with its permission keys |
| `PUT /api/v1/users/:id/roles` | `roles:manage` + CSRF | body `{ "roles": ["manager"] }` replaces the user's roles atomically |

`PUT` refuses: changing **your own** roles (403 — so the last admin can never lock everyone out, and nobody can escalate themselves), unknown role names (400, naming them), an empty list (400), an unknown user (404). In the UI, admins open **Users** from the account menu and use **Edit roles** on anyone else's row.

**Frontend authorization**

1. `AuthProvider` loads the current user from `/api/v1/auth/me`.
2. `RequireAuth` protects protected route trees and redirects unauthenticated users to `/login`.
3. `RequirePermission` wraps protected feature routes and redirects unauthorized users to `/forbidden`.
4. `PermissionGate` hides or shows UI inside an already-authenticated page without blocking navigation.

---

## Common Tasks

| Task | What to change |
|---|---|
| Add a new permission | Update `PERMISSIONS` in `back-end/prisma/seed.ts`, assign it to roles, then run `npm run prisma:seed` in `back-end/` |
| Protect a new backend route | Add `requireAuth` and `requirePermission("key")` to the route in `back-end/src/routes/*.ts` |
| Protect a new frontend route | Wrap the feature route in `front-end/src/routes/protectedRoutes.tsx` with `<RequirePermission permission="key" />` |
| Conditionally render UI | Use `<PermissionGate permission="key">...</PermissionGate>` in the frontend |
| Change role permissions | Update `ROLES[...]` in `back-end/prisma/seed.ts` and re-run seeding (seeding only adds missing role↔permission links — remove a link by hand or in a migration) |
| Give someone a role | Users page → **Edit roles** (needs `roles:manage`), or `PUT /api/v1/users/:id/roles` |
| Change user payload permissions | Update `back-end/src/mappers/user.mapper.ts` and frontend `front-end/src/auth/types/auth.types.ts` |

---

## Related Documents

- [Authentication](authentication.md)
- [Security Standards](../standards/security.md)
- [Database Standards](../standards/database.md)

---

## References

- [OWASP Authorization Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html)
