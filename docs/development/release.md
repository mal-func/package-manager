# Release Process

**CI enforces the pre-merge checklist and publishes images automatically** (`.github/workflows/ci.yml`); CD is available once a server exists (`deploy.yml`). There's still no git tagging or changelog. This documents what's automated and what's still manual.

---

## Purpose

What "releasing" currently means in this repo: CI gates every push/PR to `main`; versioning and tagging are still manual.

---

## Location

- CI workflow: `.github/workflows/ci.yml` — job `ci` runs the ordered stages below; job `publish` then pushes both images (main only).
- CD workflow: `.github/workflows/deploy.yml` — deploys each successful `main` build once enabled (see [Deployment Standards](../standards/deployment.md)).
- No release tooling, no `CHANGELOG.md`, no version-bump script.
- `front-end/package.json` (`0.0.0`) and `back-end/package.json` (`1.0.0`) are versioned independently and are not currently kept in sync with each other or with any tag.

---

## Workflow

CI runs on every push to `main` and every PR, in this locked order (see [Testing Standards](../standards/testing.md)):

```
lint → type check → tests (unit + backend integration) → build → Playwright (E2E) → coverage → security checks (npm audit)
```

A failure at any stage blocks the merge (branch protection is a repo-admin setting outside this repo's own files — enable "Require status checks to pass" for the `ci` job once you have push access to configure it). Locally, running the same checks before pushing:

```bash
# frontend
cd front-end
npm run lint && npx tsc -b && npm run test && npm run build

# backend (dev database running: docker compose -f deployment/compose/compose.dev.yaml up -d --wait)
cd back-end
npm run lint && npm run build && npm run db:test:prepare && npm run test:all

# E2E — builds and runs the whole stack in containers
cd deployment
./scripts/e2e-up.sh && npm run test:e2e
```

| Task | Current reality |
|---|---|
| Bump a version | edit the relevant `package.json` by hand — nothing keeps the two in sync |
| Tag a release | not established — see `git-rules.md`'s "Tagging Strategy" / "Semantic Versioning" for the intended convention once this is set up |
| Ship a release | merge to `main` → CI publishes `<sha>`-tagged images → CD deploys them (or `deployment/scripts/deploy.sh <sha> <sha>` by hand) |
| Change the CI pipeline | edit `.github/workflows/ci.yml` directly — see [Testing Standards](../standards/testing.md) for the locked stage order before reordering anything |

---

## Related Documents

- [Testing Standards](../standards/testing.md)
- [Deployment Standards](../standards/deployment.md)
- [Git Standards](../standards/git.md)

---

## References

- [Semantic Versioning](https://semver.org/)
- [Conventional Commits](https://www.conventionalcommits.org/)
