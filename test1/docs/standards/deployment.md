# Deployment Standards

A merge to `main` that passes CI publishes both Docker images from this repo; `deployment/` pulls and runs them, applying database migrations as part of every deploy. This describes what's implemented and what still needs a live server.

---

## Purpose

The path from a merge to `main` to a running container, and what still requires manual action.

---

## Location

| Piece | File |
|---|---|
| CI (all quality gates) | `.github/workflows/ci.yml`, job `ci` — lint → type-check → tests → build → E2E → coverage → `npm audit` |
| Image publishing | same workflow, job `publish` — runs only on `main`, only after `ci` passes |
| Image registry | GHCR — `ghcr.io/<owner>/<repo>-backend` and `-frontend`, derived from the repository (lowercased), tagged by commit SHA plus a moving `main` tag. For this repo: `ghcr.io/workgaurav1/cdis-engineering-template-{backend,frontend}` |
| CD | `.github/workflows/deploy.yml` — after a successful CI run on `main` (or by hand), runs `deploy.sh` on a self-hosted runner on the server. Off until the `DEPLOY_ENABLED` repo variable is `true` |
| Deploy / rollback / health / migration recovery | `deployment/scripts/deploy.sh`, `rollback.sh`, `health-check.sh`, `resolve-failed-migration.sh` |
| HTTPS bootstrap | `deployment/scripts/setup-https.sh` |

---

## Workflow

**Build**: multi-platform (amd64 + arm64) images via Docker Buildx, since the server's CPU architecture isn't fixed in advance. Tagged by commit SHA — build once, deploy the pulled artifact everywhere else; the server never builds from source.

**Deploy**: `deploy.sh <frontend-version> <backend-version>`:

1. pulls both images;
2. runs the new backend image's one-off `migrate` job (`prisma migrate deploy` + seed, including the optional initial admin) — **if this fails, the deploy stops with the old version still serving and nothing recorded**;
3. records the previous versions for rollback and switches the stack;
4. polls `/health` (HTTPS URL when HTTPS is on) and exits non-zero if it never answers.

Because step 2 runs while the old version still serves, **migrations must be backward-compatible** with the running version: add columns/tables in one release, remove the old ones in a later release.

**Rollback**: `rollback.sh` re-deploys whatever was live before the last deploy, through the same path. The older image's migrate job is a no-op against the newer schema ("No pending migrations").

**A failed migration** leaves a record that makes Prisma refuse every later deploy (error `P3009`). After checking what partly applied, run `resolve-failed-migration.sh <migration-name>`, fix the migration, and deploy again.

**HTTPS**: `setup-https.sh <domain> <email>` obtains a Let's Encrypt certificate (Docker `certbot`, webroot method) and switches the proxy to TLS. It records the domain in `compose/.env.https`, and every later deploy keeps the HTTPS overlay on automatically.

---

## What's real vs. what's still pending

| Piece | Status |
|---|---|
| CI gates + image publishing from this repo | Real — runs on every push to `main` |
| `deploy.sh` / `rollback.sh` / `resolve-failed-migration.sh` | Real, exercised end to end against a local registry: first deploy onto an empty DB, upgrade with a migration, rollback, a failing migration (aborted safely, old version kept serving), recovery |
| Local + production Compose stacks, Apache reverse proxy | Real, verified end to end (E2E suite in CI on every push) |
| HTTPS | Compose layering verified; real Let's Encrypt issuance not yet exercised — needs a public domain |
| CD (`deploy.yml`) | Written, linted, version-resolution logic tested; not yet run against a real self-hosted runner |
| Production server | None yet |

---

## Common Tasks

| Task | Command |
|---|---|
| Deploy a specific version pair | `./deployment/scripts/deploy.sh <frontend-sha> <backend-sha>` |
| Roll back to the previous version | `./deployment/scripts/rollback.sh` |
| Unblock deploys after a failed migration | `./deployment/scripts/resolve-failed-migration.sh <migration-name>` |
| Check a running environment's health | `./deployment/scripts/health-check.sh [base-url]` |
| Bring up HTTPS for the first time | `./deployment/scripts/setup-https.sh <domain> <email>` |
| Turn on CD | register a self-hosted runner on the server, then set repo variable `DEPLOY_ENABLED=true` — see `deployment/README.md` |

---

## Related Documents

- [Docker Standards](docker.md)
- [Environment Standards](environment.md)
- [Release Process](../development/release.md)
- [`deployment/README.md`](../../deployment/README.md) — the operator's guide

---

## References

- [Node.js Docker best practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)
- [Prisma — Deploying database changes](https://www.prisma.io/docs/orm/prisma-client/deployment/deploy-database-changes-with-prisma-migrate)
- [Prisma — Resolving migration issues in production](https://www.prisma.io/docs/orm/prisma-migrate/workflows/patching-and-hotfixing)
