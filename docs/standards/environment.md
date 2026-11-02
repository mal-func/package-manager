# Environment Standards

Both apps fail fast on missing/invalid config — no silent fallback to `undefined`.

---

## Purpose

What environment variables exist, and where they're validated.

---

## Location

| Piece | File |
|---|---|
| Backend config | `back-end/src/config/env.ts`, `back-end/.env.example` |
| Frontend config | `front-end/src/config/env.ts`, `front-end/.env.example` |
| Design rationale | `docs/architecture-decision-record/ADR-014-Configuration-Platform.md` |

---

## Workflow

Both `env.ts` modules read `process.env`/`import.meta.env` **once at import time**, validate every required key, and throw immediately if anything is missing or malformed — the app never starts in a half-configured state. Every other module imports the validated `env` object; nothing reads `process.env` directly outside these two files.

**Backend server** (`back-end/src/config/env.ts`, `back-end/.env.example`) — all required:

| Variable | Rule |
|---|---|
| `NODE_ENV` | `development` \| `test` \| `staging` \| `production` (defaults to `development` if unset) |
| `PORT` | 1–65535 |
| `CORS_ORIGIN` | the frontend's exact origin |
| `DATABASE_URL` | `mysql://user:pass@host:port/db` |
| `TRUST_PROXY_HOPS` | reverse proxies in front of the server: `0` locally, `1` behind `deployment/`'s Apache. Wrong = every client shares one rate-limit bucket (too low) or clients can spoof their IP (too high) |
| `JWT_ACCESS_SECRET` | long random value per environment |
| `JWT_ACCESS_EXPIRES_IN` | e.g. `15m` (cookie lifetime follows it) |
| `REFRESH_TOKEN_EXPIRES_IN_DAYS`, `BCRYPT_SALT_ROUNDS`, `ACCOUNT_LOCKOUT_MAX_ATTEMPTS`, `ACCOUNT_LOCKOUT_DURATION_MINUTES` | positive integers |
| `ALLOW_SELF_REGISTRATION` | exactly `true` or `false` |

**Backend seed** (`back-end/src/config/seedEnv.ts`) — read only by `prisma/seed.ts`, never by the server:

| Variable | Rule |
|---|---|
| `DATABASE_URL` | required |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | optional, both or neither; same validation as sign-up |
| `SEED_ADMIN_NAME` | optional, default `Administrator` |
| `BCRYPT_SALT_ROUNDS` | required only when creating an admin |

**Frontend** (`front-end/src/config/env.ts`, must be prefixed `VITE_` to reach the client bundle — never put secrets here):

| Variable | Rule |
|---|---|
| `VITE_APP_NAME` | shown in the sidebar, sign-in screens and browser tab |
| `VITE_APP_ENV` | `development` \| `testing` \| `staging` \| `production` |
| `VITE_API_BASE_URL` | `http://localhost:4000/api/v1` locally, `/api/v1` behind the proxy |

**Deployment** (`deployment/env/production.env.example` → `compose/.env` or `compose/.env.production`): `PUBLIC_ORIGIN`, `DB_PASSWORD`, `DB_ROOT_PASSWORD`, `JWT_ACCESS_SECRET`, and for production `FRONTEND_IMAGE`, `BACKEND_IMAGE`; optional `SEED_ADMIN_*`, `ALLOW_SELF_REGISTRATION` (production default `false`), `HTTP_PORT`. The compose files fill in every other backend variable.

---

## Common Tasks

| Task | File |
|---|---|
| Add a required backend var | add a `requireEnv(...)` (or `requirePort`/`requirePositiveInt`/`requireNonNegativeInt`/`requireBoolean`) call in `back-end/src/config/env.ts`, then add it to `.env.example`, both `vitest*.config.ts` files, CI's backend `.env` step in `.github/workflows/ci.yml`, and the `backend` service in both `deployment/compose/compose*.yaml` |
| Add a required frontend var | add a field to `Environment`, validate it in `front-end/src/config/env.ts`, add it to `.env.example` (must start with `VITE_`) |
| Set up a new machine | copy `.env.example` → `.env` in both `front-end/` and `back-end/`, fill in real values |

---

## Commands

```bash
cp back-end/.env.example back-end/.env
cp front-end/.env.example front-end/.env
```

---

## Related Documents

- [Deployment Standards](deployment.md)
- [Authentication](../architecture/authentication.md)

---

## References

- [The Twelve-Factor App — Config](https://12factor.net/config)
