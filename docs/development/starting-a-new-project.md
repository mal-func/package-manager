# Starting a New Project

Turning a clone of this template into your own project: what to rename, what to delete, and the one-time GitHub/server setup.

---

## Purpose

The template works unchanged from a fresh clone — local dev, tests, CI, image publishing. This is the checklist for making it *yours*, in the order that keeps the build green at every step.

---

## Workflow

```
clone → run it once as-is → rename → remove demo content → set up GitHub → first deploy
```

Run it unchanged first (see [START-HERE](../START-HERE.md)): if something fails before you've edited anything, it's the environment, not your changes.

---

## Common Tasks

### 1. Name and branding

| What | Where |
|---|---|
| App name shown in the UI (sidebar, sign-in screen, browser tab) | `VITE_APP_NAME` — `front-end/.env.example`, the `VITE_APP_NAME` build arg in `.github/workflows/ci.yml` (publish job) and `deployment/compose/compose.yaml` |
| Logo | replace `front-end/public/cdis_logo.png` (referenced by `Sidebar.tsx` and `AuthPageLayout.tsx`) and `front-end/public/favicon.ico` |
| Brand colours | the tokens at the top of `front-end/src/styles/globals.css` |
| PWA name | `front-end/public/manifest.json` |
| Sign-in page marketing copy | the `FEATURES` list and headline in `front-end/src/auth/components/AuthPageLayout.tsx` |
| Package names | `name` in `front-end/package.json`, `back-end/package.json`, `deployment/package.json` |
| Theme preference storage key | `STORAGE_KEY` in `front-end/src/app/shell/theme/ThemeProvider.tsx` |

### 2. Database and stack names (optional)

`cdis` is used as the database name, database user, and Compose project name. It's only visible to operators, so renaming is optional; if you do, change it everywhere at once:

- `deployment/compose/compose.dev.yaml`, `compose.yaml`, `compose.production.yaml` (`name:`, `MYSQL_DATABASE`, `MYSQL_USER`, the `DATABASE_URL`s)
- `deployment/compose/mysql-init/01-test-database.sql` (`cdis_test`, user)
- `back-end/.env.example`, `back-end/src/test-utils/testDatabase.ts`
- `.github/workflows/ci.yml` (MySQL service + backend `.env`)

Then recreate local volumes: `docker compose -f deployment/compose/compose.dev.yaml down -v` and start again.

### 3. Ownership

| What | Where |
|---|---|
| Code owners | `CODEOWNERS` |
| Where to report vulnerabilities | `SECURITY.md` |
| Sibling-repo export (CDIS-internal) | delete `scripts/export-to-repos.sh` and the export checkbox in `.github/PULL_REQUEST_TEMPLATE.md` unless you also split your project into separate repos |

### 4. Remove the demo content

Dashboard, Graphs, Charts and Table are demonstrations backed by `/api/v1/demo/...` — see [Removing a Feature](removing-a-feature.md). Keep `auth/`, `api/`, `shared/`, and the users/roles code: they're the foundation.

### 5. GitHub setup (once)

| Setting | Why |
|---|---|
| Settings → Branches → protect `main`, require the `ci` check | CI already runs on every PR; this makes it block merging |
| Settings → Actions → General → Workflow permissions: read and write | lets the `publish` job push images to GHCR with the built-in token |
| After the first `publish` run: Packages → each image → visibility / access | GHCR packages start private; the server needs to be able to pull them (make them public, or `docker login ghcr.io` on the server with a read-only token) |
| Variables → `DEPLOY_ENABLED=true` | only once a self-hosted runner exists on your server — see [`deployment/README.md`](../../deployment/README.md) |

### 6. First deploy

Follow [`deployment/README.md`](../../deployment/README.md) → "Production stack": copy `env/production.env.example` to `compose/.env.production`, set `FRONTEND_IMAGE`/`BACKEND_IMAGE` to what the `publish` job printed, set `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` to create your first admin, and run `./scripts/deploy.sh <sha> <sha>`.

---

## Related Documents

- [Start Here](../START-HERE.md)
- [Removing a Feature](removing-a-feature.md)
- [Deployment Standards](../standards/deployment.md)

---

## References

- [GitHub — Managing branch protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [GitHub Packages — Container registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
