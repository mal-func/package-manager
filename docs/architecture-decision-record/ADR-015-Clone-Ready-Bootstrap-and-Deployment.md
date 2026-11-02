# ADR-015: Clone-Ready Bootstrap and Deployment

- **Status:** Accepted
- **Date:** 2026-09-29
- **Decision Makers:** CDIS Engineering Team
- **Category:** Platform Architecture

---

# 1. Problem

A fresh clone of the template could not reach a working, deployable system without undocumented manual steps:

- a fresh install had no way to create an administrator short of hand-written SQL, and seeded permissions (`roles:manage`) were backed by no feature;
- production deploys never applied database migrations;
- only the three exported sibling repositories built and published Docker images, and the production Compose file pulled from one person's registry namespace.

---

# 2. Decisions

## 2.1 Initial administrator from seed configuration

The seed creates an administrator when `SEED_ADMIN_EMAIL` and `SEED_ADMIN_PASSWORD` are set (both or neither), or grants the admin role to an existing account with that email. It never changes an existing password and never revives a soft-deleted account, so it is safe to re-run on every deploy. The seed reads its own configuration (`config/seedEnv.ts`) and never the HTTP server's.

**Rejected:** a CLI command — explicit, but one more manual step on every new server.

## 2.2 Role assignment, not full user administration

Holders of `roles:manage` can replace any *other* user's roles (`PUT /users/:id/roles`) from the Users page. Self-registration is a required switch, `ALLOW_SELF_REGISTRATION`, off by default in production. Creating, editing and deactivating users (`users:write`) is deliberately out of scope for now.

**Consequence:** with self-registration off, the seeded admin is the only way to get an account until `users:write` is built.

## 2.3 Migrations as a step of the deploy script

`deploy.sh` runs the *new* backend image as a one-off `migrate` container (`migrate deploy` + seed) before switching traffic. A failure aborts the deploy with the previous version still serving. The one-off container is also the only place seed-only secrets appear.

**Rejected:** migrating on container start — replicas would race, and a bad migration would crash-loop the service instead of leaving the old version up.

**Consequence:** every migration must be backward-compatible with the version still running (expand, then contract in a later release).

## 2.4 This repository publishes its own images

The root CI publishes multi-platform images to `ghcr.io/<owner>/<repo>-{backend,frontend}` after every quality gate passes on `main`, tagged by commit SHA. The production Compose file requires the image names as configuration, with no default. Continuous deployment (`deploy.yml`) is included but disabled until the `DEPLOY_ENABLED` repository variable is set.

**Rejected:** leaving publishing to the sibling repositories — a clone would inherit someone else's image namespace and no pipeline of its own.

---

# 3. Consequences

## Benefits

- clone → working local stack → CI → published images → first deploy, with no hand-written SQL or edits to pipeline files
- deploys are migration-safe and roll back through the same path
- no secret needed only for bootstrapping lives in the long-running server's environment

## Trade-offs

- migrations carry a backward-compatibility obligation
- the sibling repositories' own workflows must be updated to match on the next export (they are not generated from this repository)

---

# 4. Related

- [ADR-014: Configuration Platform](ADR-014-Configuration-Platform.md) — every new setting goes through the validated config modules
- [Authorization](../architecture/authorization.md), [Deployment Standards](../standards/deployment.md)
