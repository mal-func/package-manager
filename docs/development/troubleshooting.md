# Troubleshooting

Real issues encountered building this repo, not generic advice.

---

## Purpose

Fast lookup for recurring problems and their actual fix in this codebase.

---

## Workflow

| Symptom | Cause | Fix |
|---|---|---|
| Backend throws `[Configuration Error] Missing required environment variable` on startup | `.env` missing or incomplete | `cp back-end/.env.example back-end/.env` and fill it in — see [Environment Standards](../standards/environment.md) |
| `Cannot find module '../../generated/prisma'` | Prisma client is generated, not committed | `cd back-end && npm run prisma:generate` |
| Backend can't connect to the database | Dev MySQL not running, or wrong port | `docker compose -f deployment/compose/compose.dev.yaml up -d --wait`; confirm `DATABASE_URL` targets `localhost:3308` (not 3306) |
| Every integration test file fails with `Hook timed out in 10000ms` | Can't log in to MySQL: `cdis_test` missing, or a URL without `allowPublicKeyRetrieval=true` right after MySQL restarted (MySQL 8's auth cache is cold) | `npm run db:test:prepare`; keep `allowPublicKeyRetrieval=true` in any MySQL URL used over plain TCP |
| Integration tests fail on missing tables/roles | `cdis_test` is behind on migrations | `cd back-end && npm run db:test:prepare` (re-run after pulling new migrations) |
| `[Configuration Error] Missing required environment variable: TRUST_PROXY_HOPS` (or `ALLOW_SELF_REGISTRATION`) after pulling | New required settings were added | copy the new lines from `back-end/.env.example` into your `.env` |
| Sign-in page has no "Create one" link | `ALLOW_SELF_REGISTRATION=false` on the backend | set it to `true` if you want open sign-up (see [Authentication](../architecture/authentication.md)) |
| Everyone gets `429 Too Many Requests` in a deployment | `TRUST_PROXY_HOPS` too low — every client looks like the proxy | `1` behind `deployment/`'s Apache; add one per extra proxy/load balancer in front |
| `deploy.sh` fails with Prisma `P3009` | An earlier migration failed and Prisma blocks new ones until it's resolved | check what partly applied, then `deployment/scripts/resolve-failed-migration.sh <migration-name>` — see [Deployment Standards](../standards/deployment.md) |
| `compose.production.yaml` refuses to start: `BACKEND_IMAGE is required` | Image names aren't set | set `FRONTEND_IMAGE`/`BACKEND_IMAGE` in `compose/.env.production` (the CI `publish` job's summary prints them) |
| ESLint warns `Compilation Skipped: Use of incompatible library` | React Compiler skipping components that use TanStack Table's `useReactTable` (not compiler-safe) | expected and harmless — those components just aren't auto-memoized |
| A custom `tsx`/`node` command ignores your `.env` values | Missing the `--env-file=.env` flag | Every existing script already has it (`package.json`) — copy that pattern for new ones |
| `403 Missing or invalid CSRF token` on `/auth/refresh` or `/auth/logout` | `x-csrf-token` header wasn't sent, or doesn't match the `csrf_token` cookie | Read the cookie client-side and echo its exact value as the header — see [Authentication](../architecture/authentication.md) |
| Logged in, but `/auth/me` or `/auth/refresh` returns 401 right after | `refresh_token` cookie is scoped to path `/api/v1/auth` — it won't be sent to other paths or a different base URL | Confirm the request actually hits `/api/v1/auth/...` |
| Leaflet markers render as a broken image icon | Known Leaflet + bundler issue — default marker icon paths resolve relative to Leaflet's own JS, not the app | Already fixed via `shared/components/Map/leafletIconFix.ts` — any new map code must import it (see `GeoMap.tsx`) |
| `fitBounds()` on a map looks badly zoomed out despite correct bounds | Leaflet's default `zoomSnap: 1` can't land on a fractional "true fit" zoom | `GeoMap` sets `zoomSnap={0.25}` — keep this if building another map component |
| ESLint/React Compiler error `react-hooks/set-state-in-effect` | Calling `setState` synchronously inside a bare `useEffect` body | Move the state update into the event handler that triggers it, or derive the value during render instead |
| `tsc` reports errors that don't match the current file contents | Stale incremental build cache | `npx tsc -b --force` |
| Docker can't see `/media/...` project files (Linux, snap-installed Docker) | snap confinement blocks removable-media access | `sudo snap connect docker:removable-media` |
| Docker can't read a file under `/tmp` or a hidden folder in `~` (snap-installed Docker) | snap gives Docker its own private `/tmp` and blocks dot-folders | keep build contexts and `--env-file`s inside the project or a visible home folder |

---

## Related Documents

- [Authentication](../architecture/authentication.md)
- [Environment Standards](../standards/environment.md)
- [Docker Standards](../standards/docker.md)

---

## References

- [Prisma Documentation](https://www.prisma.io/docs)
- [Leaflet Documentation](https://leafletjs.com/reference.html)
