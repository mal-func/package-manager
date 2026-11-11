# CDIS Deployment

Deployment topology, reverse proxy, deploy tooling, and end-to-end tests for the CDIS Engineering Template. This folder contains no application source.

- In the **CDIS Template monorepo** (the canonical repo), this is `deployment/`, next to `back-end/` and `front-end/`.
- It's also exported as the standalone [`cdis-deployment`](https://github.com/WorkGaurav1/cdis-deployment) repo, alongside [`cdis-frontend`](https://github.com/WorkGaurav1/cdis-frontend) and [`cdis-backend`](https://github.com/WorkGaurav1/cdis-backend). Differences for the standalone repo are called out below.

It owns: Docker Compose orchestration, the reverse proxy, deployment scripts, and the Playwright end-to-end suite (which validates the *integrated* system — browser → frontend → backend → database — not either app in isolation).

---

## Architecture

```text
Internet
   │
   ▼
Reverse Proxy (Apache httpd, single public origin)
   ├── /api/*, /health  ──▶  backend container  ──▶  Prisma  ──▶  MySQL
   └── /*               ──▶  frontend container (static build)
```

Frontend and backend share one public origin — the frontend is built with `VITE_API_BASE_URL=/api/v1` (a **relative** path), and the proxy routes `/api/*` to the backend container internally. The browser only ever talks to one origin: no CORS, and cookies (access/refresh/CSRF) work exactly as same-site cookies should. The backend runs with `TRUST_PROXY_HOPS=1` so it sees each client's real IP through the proxy.

MySQL has no published port in these stacks — only the backend (and the one-off `migrate` job) can reach it, over the internal Docker network.

---

## Repository structure

```text
compose/
├── compose.dev.yaml           dev database only (MySQL on 127.0.0.1:3308) for running the apps on the host
├── mysql-init/                creates the cdis_test database on the dev MySQL's first start
├── compose.yaml               local full stack — builds both images from source
├── compose.production.yaml    production — pulls pinned images by commit SHA
├── compose.https-init.yaml    HTTPS bootstrap overlay (certificate issuance)
└── compose.https.yaml         steady-state HTTPS overlay

reverse-proxy/apache/
├── httpd.conf                 routing: /api/* and /health -> backend, /* -> frontend
└── httpd.tls.conf.template    TLS version, rendered by setup-https.sh

scripts/
├── e2e-up.sh                  build + start the local stack, migrate + seed
├── deploy.sh                  pull, migrate, switch, health-check (production)
├── rollback.sh                redeploy the previous version pair
├── resolve-failed-migration.sh  unblock deploys after a failed migration
├── health-check.sh            probe any running environment
└── setup-https.sh             one-time Let's Encrypt + TLS switch

e2e/                           Playwright suite — see Testing below

env/
└── production.env.example     every variable the stacks need; never commit real values
```

Both `compose.yaml` and `compose.production.yaml` define a one-off **`migrate`** service (`tools` profile): the backend image running `prisma migrate deploy` + the seed. `up` never starts it; the scripts run it explicitly with `docker compose run --rm migrate`. Seed-only secrets (`SEED_ADMIN_PASSWORD`) are passed to that job only — never to the long-running backend.

---

## Local verification stack

```bash
cp env/production.env.example compose/.env
# fill in DB_PASSWORD, DB_ROOT_PASSWORD, JWT_ACCESS_SECRET (e.g. openssl rand -hex 32)

./scripts/e2e-up.sh
```

This builds both images, starts MySQL + backend + frontend + reverse proxy, waits for `/health`, then runs the `migrate` job. The app is at `http://localhost:8080` (loopback only).

The local stack always has an admin: `SEED_ADMIN_*` default to the E2E suite's `e2e-admin@example.com` / `e2e-admin-password`. That password is public, which is why this stack binds to `127.0.0.1` only — don't expose it.

Build contexts default to the monorepo's `../../back-end` and `../../front-end`. **Standalone `cdis-deployment`:** clone `cdis-backend` and `cdis-frontend` next to it and set, in `compose/.env`:

```bash
BACKEND_BUILD_CONTEXT=../../cdis-backend
FRONTEND_BUILD_CONTEXT=../../cdis-frontend
```

To tear down: `docker compose -f compose/compose.yaml down` (add `-v` to also drop the MySQL volume).

**MySQL only applies `MYSQL_PASSWORD`/`MYSQL_ROOT_PASSWORD` when it initializes a brand-new, empty data volume** — changing them in `compose/.env` later does nothing, and the app then fails to authenticate (`P1000`). `down -v` (or delete the `cdis_mysql-data` volume) and start fresh. Never do that to real data without a backup.

---

## Production stack

Pulls pinned images instead of building from source — build once in CI, deploy that exact artifact. Never `docker compose ... up --build` on the server, and never `up` by hand (that would skip migrations): always `deploy.sh`.

**One-time server setup:**

```bash
cp env/production.env.example compose/.env.production
```

Fill in real values:

| Variable | Notes |
|---|---|
| `PUBLIC_ORIGIN` | e.g. `https://app.example.com` |
| `DB_PASSWORD`, `DB_ROOT_PASSWORD`, `JWT_ACCESS_SECRET` | long random values, unique to this server |
| `FRONTEND_IMAGE`, `BACKEND_IMAGE` | image repositories without a tag — the monorepo CI's `publish` job prints them (e.g. `ghcr.io/<owner>/<repo>-backend`) |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | creates your first admin on the first deploy; safe to leave in (never changes an existing password) or delete afterwards |
| `ALLOW_SELF_REGISTRATION` | optional, default `false` — with it off, the seeded admin is currently the only way to get an account |
| `HTTP_PORT` | optional, default `80` |

If the images are private (GHCR's default), log the server in once: `docker login ghcr.io` with a token that can read packages. Then deploy (next section).

---

## Deploying and rolling back

```bash
./scripts/deploy.sh <frontend-version> <backend-version>
# e.g. ./scripts/deploy.sh 22fdf43... 22fdf43...   (monorepo: the same commit SHA for both)
```

It:

1. pulls both images;
2. runs the new backend image's `migrate` job — migrations, then the seed. **If this fails, it stops: the old version keeps serving and nothing is recorded;**
3. records what was live (`compose/current-versions.env` → `previous-versions.env`) and switches the stack;
4. polls `/health` for up to a minute (`HEALTH_CHECK_URL` overrides; `https://<domain>` once HTTPS is on) and exits non-zero on failure, pointing at rollback.

Migrations run while the previous version is still serving, so they must be backward-compatible with it (see `docs/development/adding-a-db-change.md` in the template repo).

```bash
./scripts/rollback.sh   # re-deploys whatever was live immediately before the last deploy.sh run
```

The older image's `migrate` step is a harmless no-op against the newer schema ("No pending migrations").

**If a migration fails**, Prisma records it and refuses all later deploys with `P3009`. MySQL can't roll DDL back, so first check which statements of that migration did apply and undo them (or make the fixed migration tolerate them). Then:

```bash
./scripts/resolve-failed-migration.sh <migration-name>   # the name is in deploy.sh's error output
```

and deploy a fixed version.

For an ad-hoc check against any running environment, without touching deploy state:

```bash
./scripts/health-check.sh                      # defaults to http://localhost
./scripts/health-check.sh https://app.example.com
```

It checks backend `/health` (200), frontend `/` (200), and unauthenticated `/api/v1/auth/me` (expects 401 specifically — a 200 there would mean auth is broken open).

Verified end to end against a throwaway local registry: first deploy onto an empty database, an upgrade carrying a migration, rollback, a deliberately broken migration (aborted, old version kept serving with health 200 throughout), the resulting `P3009`, recovery with `resolve-failed-migration.sh`, and a clean redeploy.

---

## HTTPS

One-time setup, once a domain resolves to this server on port 80 and a first HTTP deploy has run:

```bash
./scripts/setup-https.sh app.example.com you@example.com
```

This brings up the HTTP-only bootstrap stack (`compose.https-init.yaml`), obtains a certificate via `certbot`'s webroot method (Let's Encrypt fetches `http://<domain>/.well-known/acme-challenge/...` from the internet — the domain must already point here), renders `reverse-proxy/apache/httpd.tls.conf.template` into `reverse-proxy/apache/httpd.conf` with `envsubst`, switches to the steady-state TLS stack (`compose.https.yaml`, port 443 + HTTP→HTTPS redirect), and writes `compose/.env.https`.

**`compose/.env.https` is what keeps HTTPS on**: `deploy.sh` (and therefore CD and `rollback.sh`) includes `compose.https.yaml` whenever it exists. Don't delete it on an HTTPS server — a deploy without the overlay would recreate the proxy without its certificates.

Why `envsubst` on the host rather than container-side templating: Compose *appends* `volumes:` lists across `-f` files rather than replacing them, so an overlay can't cleanly swap which file is mounted at `/usr/local/apache2/conf/httpd.conf`. After this runs, `reverse-proxy/apache/httpd.conf` on the server holds server-local TLS config — don't `git pull` over it without re-running the substitution.

Certificates expire after 90 days. Renew periodically (e.g. monthly via cron):

```bash
cd compose
docker compose -f compose.production.yaml -f compose.https.yaml \
  --env-file .env.production --env-file .env.https --env-file current-versions.env \
  run --rm certbot certbot renew
docker compose -f compose.production.yaml -f compose.https.yaml \
  --env-file .env.production --env-file .env.https --env-file current-versions.env \
  restart reverse-proxy
```

Verified: the rendered TLS config passes Apache's `httpd -t`, and the overlays merge cleanly over `compose.production.yaml`. Real Let's Encrypt issuance isn't verified yet — it needs a public domain and server.

---

## Automated deploys (CD)

**Monorepo** (`.github/workflows/deploy.yml` at the repo root): after CI — including its `publish` job — succeeds on `main`, it deploys that commit (the same SHA for both images) with `scripts/deploy.sh`. It can also be run by hand (Actions → Deploy → Run workflow) with specific versions; a blank input keeps whatever is live on that side.

The job runs on a **self-hosted runner registered on the production server itself** — no SSH key in GitHub secrets, no inbound SSH from GitHub's IP ranges. The runner should run as a low-privilege user in the `docker` group.

One-time setup, once the server exists:

1. **Register the runner** — Settings → Actions → Runners → New self-hosted runner, follow GitHub's `./config.sh` command on the server, then install it as a service (`sudo ./svc.sh install && sudo ./svc.sh start`). It must be runner v2.327.1 or newer — the workflows use Node 24 actions.
2. **Create `deployment/compose/.env.production`** inside the runner's checkout of the repo (see Production stack). The workflow checks out with `clean: false`, so this and the version files survive between runs.
3. **Turn it on** — set the repository variable `DEPLOY_ENABLED` to `true` (Settings → Secrets and variables → Actions → Variables). Until then the workflow skips, rather than queueing jobs for a runner that doesn't exist.

**Standalone repos:** `cdis-frontend`/`cdis-backend`'s own CI publish their images and fire a `repository_dispatch` at `cdis-deployment`, whose own `.github/workflows/deploy.yml` fills in the other app's version from `current-versions.env`. Those workflows live only in the standalone repos (the export never copies `.github/`); see their READMEs.

---

## Testing

The Playwright suite in `e2e/` drives a real browser against whatever's running at `E2E_BASE_URL` (default `http://localhost:8080`, the local stack). It doesn't manage its own environment:

```bash
./scripts/e2e-up.sh     # bring the environment up first
npm run test:e2e        # then run the suite

# or against any other running environment:
E2E_BASE_URL=https://staging.example.com E2E_ADMIN_EMAIL=... E2E_ADMIN_PASSWORD=... npm run test:e2e
```

Coverage: registration through the Register page, login (success + wrong credentials), session persistence across a reload, logout (and that the backend session is really revoked), sidebar and account-menu navigation to every page, the permission-gated `/forbidden` redirect, the 404 catch-all, and role assignment (the seeded admin grants a role in the UI and the other user's existing session gains access without signing in again). The suite registers its own users, so the target needs `ALLOW_SELF_REGISTRATION=true`, and it signs in as the seeded admin.

This is a baseline suite — one representative path per concern. Deeper behaviour is covered by each app's unit/component/integration tests.

---

## What's not here yet

- A real production server — everything above is verified locally (including real pulls from a registry), not yet on a publicly reachable host
- A registered self-hosted runner (needs the server) — `deploy.yml` is written, linted and its version resolution tested, but not yet run for real
- Real Let's Encrypt issuance (needs the domain + server)

---

## References

- Docker Compose — https://docs.docker.com/compose/
- Apache httpd (mod_proxy/mod_ssl) — https://httpd.apache.org/docs/2.4/
- Prisma Migrate in production — https://www.prisma.io/docs/orm/prisma-client/deployment/deploy-database-changes-with-prisma-migrate
- Playwright — https://playwright.dev
