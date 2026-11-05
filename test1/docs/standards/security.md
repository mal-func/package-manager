# Security Standards

What's actually implemented, mapped to the OWASP guidance it follows.

---

## Purpose

The security controls in place today, and where to find/modify each one.

---

## Location

| Control | File |
|---|---|
| Security headers | `back-end/src/app.ts` (`helmet()`) |
| CORS | `back-end/src/app.ts` (locked to `CORS_ORIGIN`, `credentials: true`) |
| Rate limiting (global + login) | `back-end/src/app.ts`, `back-end/src/middlewares/rateLimiters.ts` — keyed on `req.ip`, which is only correct with `TRUST_PROXY_HOPS` set right |
| Self-registration switch | `ALLOW_SELF_REGISTRATION`, checked first in `auth.service.ts` `register()` |
| Role changes | `back-end/src/services/user.service.ts` `setRoles()` — no self-edits |
| Secrets kept off the server | seed-only variables (`SEED_ADMIN_PASSWORD`) go to the one-off `migrate` container only |
| CSRF (double-submit cookie) | `back-end/src/middlewares/csrf.ts` |
| Password hashing | `back-end/src/services/auth.service.ts` (bcrypt, cost from `BCRYPT_SALT_ROUNDS`) |
| Account lockout | `back-end/src/services/auth.service.ts` |
| Session tokens | `back-end/src/lib/cookies.ts`, `services/token.service.ts` — see [Authentication](../architecture/authentication.md) |
| Authorization | `back-end/src/middlewares/requirePermission.ts` — see [Authorization](../architecture/authorization.md) |
| Input validation | `back-end/src/middlewares/validate.ts` + Zod schemas in `data-transfer-object/` |
| Response sanitization | `back-end/src/mappers/user.mapper.ts` (`toSafeUser` strips `passwordHash`) |

---

## Workflow

- **Cookies**: `access_token`/`refresh_token` are httpOnly (invisible to JS); `csrf_token` deliberately is not — the double-submit pattern needs JS to read it and echo it as the `x-csrf-token` header. All three are `sameSite: "lax"`, and `secure` in `production` and `staging`.
- **CSRF** is checked on every authenticated, state-changing route (`/auth/refresh`, `/auth/logout`, `PUT /users/:id/roles`) — login/register have no prior session to ride. New state-changing routes must add `requireCsrfToken`.
- **Client IP behind the proxy**: Express trusts exactly `TRUST_PROXY_HOPS` proxies when reading `X-Forwarded-For`. The value must match the real topology — `0` when clients connect directly, `1` behind `deployment/`'s Apache — or rate limits either lump every user together or can be dodged with a forged header. Validated as a non-negative integer, so Express's unsafe `true` is rejected.
- **Self-registration** can be switched off (`ALLOW_SELF_REGISTRATION=false`, the production default); the check runs before any lookup, so a closed deployment doesn't reveal which emails exist.
- **Privilege changes**: only `roles:manage` holders can change roles, never their own (no self-escalation, no locking out the last admin). Permissions reload on every request, so revocation is immediate.
- **Login enumeration**: "no such user" and "wrong password" return the identical `401` message.
- **Refresh token reuse detection**: presenting an already-rotated refresh token revokes every session for that user (see [Authentication](../architecture/authentication.md)).
- **Authorization always checks permission keys, never role names** in guards (see [Authorization](../architecture/authorization.md)).

### Dependency updates

A dependency is upgraded only when a published advisory affects the version we ship. Two things enforce that:

- **CI** runs `npm audit --audit-level=high` for `back-end/`, `front-end/` and `deployment/` on every push and PR — a high or critical advisory fails the build.
- **Dependabot** (`.github/dependabot.yml`) is set to security updates only. When an advisory is published, it opens **one PR per directory** with every fix for that directory — no PR on a schedule, no version bumps. This needs **Dependabot alerts** and **Dependabot security updates** switched on in the repo's Settings → Code security; without them the config does nothing.

Fixing an advisory by hand (or reviewing Dependabot's PR): check the advisory's first patched version (`gh api /advisories/<GHSA-id>`), then `npm audit fix` — never `--force`, which is allowed to jump major versions. If the vulnerable package is pinned by another package (e.g. `mariadb` by `@prisma/adapter-mariadb`), raise its entry in `overrides` in `package.json` to the patched version instead. Major-version upgrades are their own deliberate, reviewed change, never part of a security fix.

---

## Common Tasks

| Task | File |
|---|---|
| Add a rate limiter to a new route | follow the pattern in `rateLimiters.ts`, apply as route middleware |
| Add validation to a new endpoint | Zod schema in `data-transfer-object/`, `validateBody(schema)` in the route |
| Strip sensitive fields from a response | add/extend a mapper in `mappers/` |
| Change password/lockout policy | `.env` — see [Environment Standards](environment.md) |
| Protect a new state-changing route | `requireAuth, requireCsrfToken, requirePermission("key")` |

---

## Related Documents

- [Authentication](../architecture/authentication.md)
- [Authorization](../architecture/authorization.md)
- [Environment Standards](environment.md)

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP CSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
