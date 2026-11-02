# Docker Standards

Both apps have real, multi-stage Dockerfiles, and `deployment/compose/` is the actual local-through-production Compose model. This file describes what exists now — for the CI/CD pipeline that builds and publishes these images, see [Deployment Standards](deployment.md).

---

## Purpose

Where each app's Dockerfile lives, what it produces, and how the Compose stacks in `deployment/` use them.

---

## Location

| Piece | File |
|---|---|
| Frontend image | `front-end/Dockerfile` — multi-stage: `node:22-alpine` build → `nginx:1.29-alpine` runtime, non-root |
| Backend image | `back-end/Dockerfile` — multi-stage: `node:22-alpine` deps/prod-deps → `node:22-alpine` runtime, non-root, runs TS source directly via `tsx` (no compiled artifact) |
| Dev database | `deployment/compose/compose.dev.yaml` — MySQL only on `127.0.0.1:3308`, for `npm run dev` and integration tests; `mysql-init/` creates `cdis_test` |
| Local full stack | `deployment/compose/compose.yaml` — builds both images from source (`front-end/`, `back-end/`), for local end-to-end verification and CI's E2E stage |
| Production compose | `deployment/compose/compose.production.yaml` — pulls `FRONTEND_IMAGE`/`BACKEND_IMAGE` pinned by commit SHA, never `:latest` |
| One-off `migrate` service | in both `compose.yaml` and `compose.production.yaml`, `tools` profile — same image as `backend`, runs `migrate deploy` + seed; never started by `up` |
| HTTPS overlays | `deployment/compose/compose.https-init.yaml`, `compose.https.yaml` — bootstrap and steady-state TLS, layered on top of the production compose file |
| Reverse proxy | `deployment/reverse-proxy/apache/httpd.conf`, `httpd.tls.conf.template` — Apache httpd, single public origin fronting both containers |

---

## Workflow

**Frontend image**: `node:22-alpine` installs deps and runs `vite build` with real production `VITE_*` build args (`VITE_API_BASE_URL=/api/v1`, a relative path — the reverse proxy makes this work regardless of the deployed origin). The runtime stage copies the static build into an `nginx:1.29-alpine` image, runs as the non-root `nginx` user (via `setcap cap_net_bind_service` so it can still bind port 80 unprivileged), and exposes `/health`. Its `HEALTHCHECK` targets `127.0.0.1`, not `localhost` — Alpine resolves `localhost` to IPv6 `::1`, where nginx doesn't listen.

**Backend image**: `node:22-alpine` installs full deps for `prisma generate`, then a second `prod-deps` stage installs only production dependencies, then the runtime stage copies both the generated Prisma client and the TypeScript source and runs it directly via `tsx` — there is still no compiled `dist/`, `tsx` is a real runtime dependency in production, not a dev tool. Runs as a non-root `app` user, `HEALTHCHECK` hits `/health`.

**Migrations and seed** run in the separate `migrate` service rather than inside `backend`, so secrets only the seed needs (`SEED_ADMIN_PASSWORD`) never reach the long-running server's environment, and so a deploy can migrate with the *new* image before switching traffic to it.

**MySQL healthchecks** ping over TCP (`-h 127.0.0.1`): during first-time init the image runs a temporary server that answers on the Unix socket before init scripts and user creation finish, so a socket ping reports healthy too early.

**Local verification**: `deployment/compose/compose.yaml` builds both images from this repo's `front-end/`/`back-end/` and wires them behind Apache on `localhost:8080` — this is how the whole stack gets exercised end to end (`scripts/e2e-up.sh`, and CI).

**Production**: `deployment/compose/compose.production.yaml` never builds from source — it pulls `${FRONTEND_IMAGE}:<sha>` / `${BACKEND_IMAGE}:<sha>`, published by this repo's CI (see [Deployment Standards](deployment.md)). Images and versions are all required, with no default — an unset or `:latest`-pointed deploy fails loudly, and a clone can never silently pull someone else's images. `HTTP_PORT` (default 80) moves the proxy's host port if something else owns 80.

---

## Common Tasks

| Task | Command |
|---|---|
| Build the frontend image locally | `docker build -t cdis-frontend --build-arg VITE_API_BASE_URL=/api/v1 front-end/` |
| Build the backend image locally | `docker build -t cdis-backend back-end/` |
| Start the dev database | `docker compose -f deployment/compose/compose.dev.yaml up -d --wait` |
| Bring up the full local stack, migrated and seeded | `cd deployment && ./scripts/e2e-up.sh` |
| Run the production-model stack (pulled images) | `cd deployment && ./scripts/deploy.sh <frontend-sha> <backend-sha>` — never `up` by hand, which would skip migrations |
| Add HTTPS locally/in production | see `deployment/scripts/setup-https.sh` and [Deployment Standards](deployment.md) |

---

## Related Documents

- [Deployment Standards](deployment.md)
- [Environment Standards](environment.md)
- [Database Standards](database.md)

---

## References

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MySQL Docker Official Image](https://hub.docker.com/_/mysql)
