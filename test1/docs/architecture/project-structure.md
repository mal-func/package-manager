# Project Structure

The actual on-disk layout of this repository and where new code belongs.

---

## Purpose

Show developers the real structure of both the frontend and backend, not a hypothetical one.

---

## Location

Root layout:

```
front-end/
back-end/
deployment/
docs/
scripts/        # export-to-repos.sh (CDIS's sibling-repo split)
.github/        # ci.yml (checks + image publishing), deploy.yml (CD), dependabot.yml (security updates only)
README.md
```

`deployment/` owns Docker Compose (dev database, local stack, production, HTTPS overlays), the Apache reverse proxy config, deploy/rollback/health-check/migration-recovery scripts, and the cross-application Playwright E2E suite — see [Deployment Standards](../standards/deployment.md) and [Docker Standards](../standards/docker.md).

---

## Workflow

**Front-end (`front-end/src/`)**

| Dir | Purpose |
|---|---|
| `api/` | HTTP client, typed API layer, interceptors for auth/session behavior |
| `app/` | App providers, shell, layout composition |
| `assets/` | static assets (fonts, icons, images, SVG) |
| `auth/` | authentication module: login/register pages, forms, route guards, permission hooks, API calls |
| `config/` | runtime app config and environment mapping |
| `features/` | feature modules: `users` and `settings` (foundational), `dashboard`, `graphs`, `charts`, `tables` (demo content) |
| `layouts/` | public and protected route layouts |
| `routes/` | route definitions and route composition |
| `shared/` | reusable components, hooks, utils, validations, types |
| `styles/` | global CSS, theme variables |

A feature module looks like:

```
features/<feature>/
  api/
  components/
  hooks/
  pages/
  types/
  <feature>.module.tsx
  index.ts
```

**Back-end (`back-end/src/`)**

| Dir | Purpose |
|---|---|
| `config/` | validated environment config (`env.ts`) |
| `controllers/` | HTTP handlers, request/response mapping |
| `data-transfer-object/` | Zod request validation schemas |
| `errors/` | application error classes and typed error handling |
| `lib/` | Prisma client, cookie helpers, logger |
| `mappers/` | response-safe data mapping, e.g. `toSafeUser` |
| `middlewares/` | auth, permission, CSRF, validation, rate limiting, 404/error handlers |
| `repositories/` | Prisma queries and persistence logic |
| `routes/` | route registration and route files |
| `seed/` | seed logic that needs testing (the initial admin); `prisma/seed.ts` runs it |
| `services/` | business logic, token/session rules, auth workflows |
| `test-utils/` | shared backend test helpers, the integration-test database URL |
| `types/` | ambient type declarations (`req.user`, `req.validatedQuery`) |
| `utils/` | response envelope helpers |
| `prisma/` (outside `src/`) | schema, migrations, `seed.ts`, `prepare-test-database.ts` |

---

## Common Tasks

| Task | Location |
|---|---|
| Add a frontend feature | `front-end/src/features/<name>/`, register in `front-end/src/routes/protectedRoutes.tsx` (and `front-end/src/config/navigation/navigationConfig.ts` for a sidebar entry) |
| Add a shared component | `front-end/src/shared/components/` |
| Add a backend resource | new `controller`, `service`, `repository`, `route`, `dto` files in `back-end/src/` |
| Add a database model | `back-end/prisma/schema.prisma`, then `cd back-end && npm run prisma:migrate` |
| Add architecture docs | `docs/architecture/` |
| Add standards docs | `docs/standards/` |
| Add development workflow docs | `docs/development/` |

---

## Related Documents

- [System Design](system-design.md)
- [Authentication](authentication.md)
- [Authorization](authorization.md)
- [Adding a Feature](../development/adding-feature.md)
- [Adding a Module](../development/adding-module.md)

---

## References

- [React Documentation](https://react.dev/)
- [Express Documentation](https://expressjs.com/)
