# Testing Standards

Vitest for both apps, Playwright for E2E. Coverage thresholds are configured and **met globally on both apps**, including every security-critical file.

---

## Purpose

How tests are organized, run, and gated in this project.

---

## Location

| Piece | File |
|---|---|
| Backend unit config | `back-end/vitest.config.ts` |
| Backend integration config | `back-end/vitest.integration.config.ts` |
| Frontend config | `front-end/vitest.config.ts`, `front-end/vitest.setup.ts` |
| Backend test helpers | `back-end/src/test-utils/` (Express req/res mocks) |
| E2E config | `deployment/playwright.config.ts` |
| E2E specs + helpers | `deployment/e2e/` |
| CI workflow | `.github/workflows/ci.yml` |

E2E drives a real browser against the whole deployed stack (frontend + backend + MySQL, all in containers, behind the Apache reverse proxy) — not the dev server, not mocked. `deployment/scripts/e2e-up.sh` builds and starts that stack and runs migrations/seed; `playwright.config.ts` has no `webServer` of its own, it just points at whatever's running (`E2E_BASE_URL`, defaulting to `http://localhost:8080`). This means the same suite can run against a local build or a real deployed environment unchanged.

---

## Workflow

**Backend** — two separate configs:
```
npm run test              → *.test.ts        (unit, mocked, no real DB)
npm run test:integration  → *.integration.test.ts  (real MySQL, dedicated cdis_test DB, no file parallelism)
npm run test:all          → both
```
Integration tests need the dev database running (`docker compose -f deployment/compose/compose.dev.yaml up -d --wait`, which creates `cdis_test`) and prepared once with `npm run db:test:prepare` (migrations + seeded roles; re-run after pulling new migrations). The URL lives in `src/test-utils/testDatabase.ts`.
Unit tests set a lower `BCRYPT_SALT_ROUNDS=4` — cost doesn't affect correctness, only brute-force resistance, so this keeps hundreds of hash calls fast.

**Frontend** — Vitest + React Testing Library + jsdom, one config, `npm run test`.

**E2E** — Playwright, run from `deployment/`: `./scripts/e2e-up.sh && npm run test:e2e`. Covers registration through the Register page, the login/logout flow, session persistence across a reload, sidebar/account-menu navigation to every page, the permission-gated redirect to `/forbidden`, the catch-all 404, and role assignment (the seeded admin grants a role in the UI; the other user's existing session gains access without signing in again). The admin comes from `SEED_ADMIN_*` in `deployment/compose/.env` — `e2e-admin@example.com` / `e2e-admin-password` by default, or set `E2E_ADMIN_EMAIL`/`E2E_ADMIN_PASSWORD`. Deliberately a baseline suite (one representative path per page), not exhaustive — Vitest component tests cover the deeper per-page behavior.

**Coverage** — both configs set a global floor (**85% lines/statements/functions, 80% branches**) and a higher bar (**95%/90%**) on specific security-critical files:
```
back-end:  auth.service.ts, token.service.ts, requireAuth.ts,
           requirePermission.ts, csrf.ts, cookies.ts
front-end: usePermission.ts, RequireAuth.tsx, RequirePermission.tsx,
           interceptors.ts
```
Both the global floor and every security-critical file's higher bar are met today, on both apps — `npm run test:coverage` passes cleanly in `back-end/` and `front-end/`. A few presentational/bootstrap files sit meaningfully below the floor on their own (`GeoMap.tsx`, `DashboardPage.tsx`, `LoginForm.tsx`) — real Leaflet interaction is unstable to simulate in jsdom (simulated clicks can trigger Leaflet's internal double-click detection against a zero-size layout and throw), so those lean on the E2E suite and the manual browser verification each covers instead of deeper unit coverage. The global aggregate absorbs this with room to spare.

---

## Common Tasks

| Task | Command |
|---|---|
| Run backend unit tests | `cd back-end && npm run test` |
| Run backend integration tests | `docker compose -f deployment/compose/compose.dev.yaml up -d --wait`, then `cd back-end && npm run db:test:prepare && npm run test:integration` |
| Run frontend tests | `cd front-end && npm run test` |
| Run E2E tests | `cd deployment && ./scripts/e2e-up.sh && npm run test:e2e` |
| Check coverage | `npm run test:coverage` in either app |
| Add a security-critical file's threshold | add its path to the `coverage.thresholds` object in the relevant `vitest.config.ts` |
| Change what CI runs | edit `.github/workflows/ci.yml` — the stage order (lint → type check → tests → build → E2E → coverage → security) is locked; extend a stage rather than reorder |

---

## Related Documents

- [Code Style](code-style.md)
- [Authentication](../architecture/authentication.md)

---

## References

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
