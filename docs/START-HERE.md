# Start Here

The golden path from a clean clone to your first PR. Every command here is real and project-specific — nothing generic to React/Express, only what CDIS actually needs.

---

## 1. What this is

CDIS's engineering template: a React + TypeScript frontend, a Node.js + Express + TypeScript backend, cookie-based auth with RBAC, and a real Docker/CI/CD pipeline — meant to be cloned and extended for a new project, not deployed as-is.

Three sibling repositories — `cdis-frontend`, `cdis-backend`, `cdis-deployment` — are independently clone/build/run-able exports of this repo's `front-end/`, `back-end/`, and `deployment/` folders. If you only need one piece standalone (e.g. you're only touching the backend), clone the matching sibling repo instead. If you're extending the template itself, work here.

---

## 2. Prerequisites

- Git
- Node.js 22+
- npm
- Docker + Docker Compose v2

---

## 3. Clone and install

```bash
git clone <repository-url>
cd cdis-engineering-template

cd front-end && npm install && cd ..
cd back-end && npm install && cd ..
cd deployment && npm install && cd ..   # only needed for the E2E suite
```

---

## 4. Configure environment

```bash
cp front-end/.env.example front-end/.env
cp back-end/.env.example back-end/.env
```

Defaults in both files match the local MySQL container's credentials below — no edits needed for local dev.

---

## 5. Start the database

```bash
docker compose -f deployment/compose/compose.dev.yaml up -d --wait
```

This is MySQL only, on `localhost:3308`, with fixed dev credentials (the ones already in `back-end/.env.example`). On first start it creates two databases: `cdis` for development and `cdis_test` for the integration tests.

Then create the tables and seed reference data (roles/permissions + demo datasets):

```bash
cd back-end
npx prisma migrate deploy   # applies every committed migration
npm run prisma:seed
npm run db:test:prepare     # same, for the cdis_test database
```

(`npm run prisma:migrate` is for *changing* the schema — it generates a new migration. See [Adding a Database Change](development/adding-a-db-change.md).)

---

## 6. Start the backend and frontend

```bash
# terminal 1
cd back-end && npm run dev

# terminal 2
cd front-end && npm run dev
```

---

## 7. Verify it's running

- Backend health: `curl http://localhost:4000/health` → `{"success":true,"data":{"status":"ok",...}}`
- Frontend: open `http://localhost:5173`

---

## 8. Sign in and become an admin

Open `http://localhost:5173`, choose **Create one**, and register. New accounts get the plain `user` role.

To make yourself an admin (needed for the Users page and the role editor), point the seed's initial-admin settings at your account in `back-end/.env` and re-run the seed:

```bash
# back-end/.env
SEED_ADMIN_EMAIL=you@example.com
SEED_ADMIN_PASSWORD=any-8-plus-characters   # required, but never applied to an existing account
```

```bash
cd back-end && npm run prisma:seed
# Seed: initial admin you@example.com already existed; admin role granted (password left unchanged).
```

Reload the app — the account menu now has **Users**, where admins can change anyone else's roles. The same variables create the first admin on a real server; see [`deployment/README.md`](../deployment/README.md).

---

## 9. Run the tests

```bash
cd front-end && npm test
cd back-end && npm test          # unit only
cd back-end && npm run test:all  # unit + integration against the real cdis_test database (step 5)
```

Cross-application E2E (drives a real browser against the whole stack):

```bash
cd deployment
./scripts/e2e-up.sh
npm run test:e2e
```

---

## 10. Common tasks

Each of these is a short, real, command-first doc — not a generic tutorial:

- [Adding a feature](development/adding-feature.md) — the feature-module self-registration pattern
- [Removing a feature](development/removing-a-feature.md) — most commonly, deleting the demo content
- [Adding an API endpoint](development/adding-api.md) — route → DTO → middleware → controller → service → repository
- [Adding a database change](development/adding-a-db-change.md) — schema → migration → seed
- [Starting a new project](development/starting-a-new-project.md) — renaming, branding, GitHub and server setup for your own clone

---

## 11. Before you open a PR

```bash
cd front-end && npm run lint && npx tsc -b && npm test
cd back-end && npm run lint && npm run build && npm run test:all
```

These are the per-app checks CI runs. CI additionally runs the Playwright E2E suite against the full containerized stack (step 9), coverage thresholds, and `npm audit` — see [Testing Standards](standards/testing.md).

---

## 12. Understand what's example content

The dashboard, charts, graphs, and tables features are demonstration content — backed by literal `/api/v1/demo/...` endpoints and Prisma models named `DemoStateMetric`/`DemoChartDataset`/etc. They exist to show real, working patterns for maps/charts/tables; a new project deletes or replaces them (see [Removing a Feature](development/removing-a-feature.md)). `auth/`, the API client, and the shared `Chart`/`DataTable`/`Map` components are foundational — keep those.

---

## Next

- [`docs/architecture/system-design.md`](architecture/system-design.md) — how the pieces fit together, request flow, session design
- [`docs/standards/`](standards/) — coding, testing, security, Docker, deployment conventions
- [`deployment/README.md`](../deployment/README.md) — the full deployment story, if you're touching that
