# Contributing

## Before you start

Read [`docs/START-HERE.md`](docs/START-HERE.md) — it covers bootstrap, running the app, and running the tests. This file covers the actual contribution process.

## Workflow

1. Branch off `main`.
2. Make your change. If you're adding/removing a feature, an API endpoint, or a database change, follow the matching guide in [`docs/development/`](docs/development/) — they're short and command-first.
3. Before opening a PR, run the same checks CI runs:
   ```bash
   cd front-end && npm run lint && npx tsc -b && npm test
   cd back-end && npm run lint && npm run build && npm run test:all
   ```
4. Open a PR against `main`. CI runs lint → type-check → tests → build → E2E → coverage → security checks, in that order — a failure at any stage blocks the merge (once branch protection requires the `ci` check).
5. Keep commits scoped to one logical change; write commit messages that explain *why*, not just what changed.

## Where things live

This repo is the canonical, complete CDIS template — `front-end/`, `back-end/`, `deployment/`, and `docs/` all live here together, and this is where new work happens first. Three sibling repos (`cdis-frontend`, `cdis-backend`, `cdis-deployment`) are independently clone/build/run-able exports of this repo, regenerated via `scripts/export-to-repos.sh` — don't edit them directly.

## Reporting a security issue

See [`SECURITY.md`](SECURITY.md) — don't open a public issue for a vulnerability.

## Coding standards

See [`docs/standards/`](docs/standards/) for code style, naming conventions, Git conventions, and testing requirements.
