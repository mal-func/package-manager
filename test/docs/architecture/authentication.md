# Authentication

Cookie-based session authentication with JWT access tokens, rotating opaque refresh tokens, and CSRF protection.

---

## Purpose

Describe how this repository authenticates users, restores sessions, rotates refresh tokens, and terminates authenticated sessions.

---

## Location

| Layer | Files |
|---|---|
| API routes | `back-end/src/routes/auth.routes.ts` |
| Controller | `back-end/src/controllers/auth.controller.ts` |
| Business logic | `back-end/src/services/auth.service.ts` |
| Token operations | `back-end/src/services/token.service.ts` |
| Cookie handling | `back-end/src/lib/cookies.ts` |
| Auth guard | `back-end/src/middlewares/requireAuth.ts` |
| CSRF guard | `back-end/src/middlewares/csrf.ts` |
| Login/register validation | `back-end/src/data-transfer-object/auth.dto.ts` |
| App config | `back-end/src/config/env.ts` |
| React auth state | `front-end/src/auth/context/AuthProvider.tsx` |
| Login / Register pages | `front-end/src/auth/pages/{LoginPage,RegisterPage}.tsx` (shared shell: `components/AuthPageLayout.tsx`) |
| Form logic | `front-end/src/auth/hooks/{useLogin,useRegister}.ts` |
| Public auth options | `GET /api/v1/auth/options` → `front-end/src/auth/hooks/useAuthOptions.ts` |
| Route guards | `front-end/src/auth/components/{RequireAuth,RedirectIfAuthenticated}.tsx` |
| Client interceptors | `front-end/src/api/client/interceptors.ts` |

---

## Workflow

**Login**

1. `LoginPage` renders `LoginForm`.
2. `useLogin()` validates inputs with `loginSchema` and calls `AuthProvider.login()`.
3. `AuthProvider.login()` calls `authService.login()`.
4. `authService.login()` calls `authApi.login()`.
5. `authApi.login()` sends `POST /api/v1/auth/login`.
6. Backend `auth.controller.login()` verifies credentials and issues a token pair.
7. `setAuthCookies()` writes:
   - `access_token` (httpOnly, path `/`)
   - `refresh_token` (httpOnly, path `/api/v1/auth`)
   - `csrf_token` (readable by JS, path `/`)
8. Frontend stores the authenticated user in React Query via `AuthProvider`.

**Registration**

1. `LoginPage` asks `GET /api/v1/auth/options` and shows **Create one** only when `selfRegistration` is `true`.
2. `RegisterPage` validates with `registerSchema` (same rules as the backend, plus a confirm-password check) and calls `POST /api/v1/auth/register`.
3. Backend `authService.register()` first checks `ALLOW_SELF_REGISTRATION` — when it's `false` the request is refused with `403` before any lookup, so a closed deployment can't be probed for which emails exist.
4. The new account gets only the `user` role (atomically, in one transaction) and is signed in straight away: the same three cookies as login.
5. `useRegister()` stores the user where `AuthProvider` keeps the session, and `RedirectIfAuthenticated` sends them into the app.

**Session restore**

1. `AuthProvider` mounts and calls `authService.getCurrentUser()`.
2. `authApi.getCurrentUser()` sends `GET /api/v1/auth/me`.
3. Backend `requireAuth` validates the `access_token` cookie, reloads the user (with roles and permissions) from the database, and sets `req.userId` and `req.user`.
4. On success, `auth.controller.me()` returns the current user.
5. `AuthProvider` caches the user and exposes `isAuthenticated: true`.

**Silent refresh**

1. Axios interceptor catches a `401` response from any non-auth bootstrap request.
2. It sends `POST /api/v1/auth/refresh` with the CSRF header from `csrf_token`.
3. Backend `auth.service.refresh()`:
   - locates refresh token by hashed value
   - detects expired or already-revoked tokens
   - rotates the refresh token pair on success
   - revokes all sessions if reuse is detected
4. If refresh succeeds, the original request is retried.
5. If refresh fails, the frontend dispatches `auth:session-expired` and clears authenticated state.

**Logout**

1. `ProfileMenu` calls `AuthProvider.logout()`.
2. `AuthProvider.logout()` calls `authService.logout()`.
3. `authApi.logout()` sends `POST /api/v1/auth/logout`.
4. Backend `requireAuth` + `requireCsrfToken` validates the request.
5. `auth.service.logout()` revokes the refresh token server-side.
6. `clearAuthCookies()` removes auth cookies.
7. Frontend clears the cached user.

---

## Key implementation details

- Access tokens are JWTs signed with `JWT_ACCESS_SECRET` and verified in `tokenService.verifyAccessToken()`.
- Refresh tokens are random opaque values hashed with SHA-256 before persistence.
- Refresh tokens rotate on every refresh. Old refresh tokens are marked rotated; reuse detection revokes all sessions for the user.
- The frontend never reads or stores auth tokens. Authentication state comes from `GET /api/v1/auth/me` and cookie-based sessions.
- `csrf_token` is intentionally readable by JS to support the double-submit CSRF pattern.
- `login` is protected by the backend login rate limiter.
- Self-registration is controlled by `ALLOW_SELF_REGISTRATION` (required, exactly `true`/`false`). With it off, accounts come only from the seeded initial admin (`SEED_ADMIN_*`, see [Authorization](authorization.md)) — there is no admin-side "create user" yet.
- Permissions are reloaded on every request (not stored in the JWT), so a role change or a deleted account takes effect on the very next request.

---

## Common tasks

| Task | What to change |
|---|---|
| Change access token lifetime | `JWT_ACCESS_EXPIRES_IN` in backend env — the cookie's `maxAge` is derived from it automatically |
| Change refresh token lifetime | `REFRESH_TOKEN_EXPIRES_IN_DAYS` in backend env |
| Change password hashing cost | `BCRYPT_SALT_ROUNDS` in backend env |
| Change lockout policy | `ACCOUNT_LOCKOUT_MAX_ATTEMPTS` / `ACCOUNT_LOCKOUT_DURATION_MINUTES` in backend env |
| Add a new auth route | `back-end/src/routes/auth.routes.ts` → controller → service → schema |
| Turn sign-up on/off | `ALLOW_SELF_REGISTRATION` in backend env (the login page follows automatically) |
| Add a login-related UI page | new `front-end/src/auth/pages/*` using `AuthPageLayout`, wire into `front-end/src/routes/publicRoutes.tsx` |
| Change user payload shape | `back-end/src/mappers/user.mapper.ts` + `front-end/src/auth/types/auth.types.ts` |
| Debug refresh failures | inspect `/api/v1/auth/refresh` response and `csrf_token` cookie in browser devtools |

---

## Commands

```bash
curl -c cookies.txt -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"P@ssw0rd"}'

curl -b cookies.txt http://localhost:4000/api/v1/auth/me
```

---

## Related Documents

- [Authorization](authorization.md)
- [System Design](system-design.md)
- [Security Standards](../standards/security.md)
- [Environment Standards](../standards/environment.md)

---

## References

- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [JWT — RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)
