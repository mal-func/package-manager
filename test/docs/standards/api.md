# API Standards

The actual request/response conventions used by the backend and frontend in this repository.

---

## Purpose

Describe how backend routes behave and how frontend code consumes API responses.

---

## Location

| Piece | File |
|---|---|
| Response envelope | `back-end/src/utils/apiResponse.ts` |
| Error handling | `back-end/src/middlewares/errorHandler.ts` |
| Validation middleware | `back-end/src/middlewares/validate.ts` |
| API route mounting | `back-end/src/routes/index.ts` |
| Frontend API client | `front-end/src/api/client/apiClient.ts` |
| HTTP client | `front-end/src/api/client/httpClient.ts` |
| Axios interceptors | `front-end/src/api/client/interceptors.ts` |
| API types | `front-end/src/api/types.ts` |

---

## Workflow

**Backend response contract**

- Success responses use `sendSuccess(res, data, statusCode)`.
- Error responses use `sendError(res, statusCode, code, message)`.
- All responses are JSON envelopes.

**Success envelope**

```json
{
  "success": true,
  "data": {
    ...
  }
}
```

**Error envelope**

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable message"
  }
}
```

**Endpoints** (all under `/api/v1` except `/health`)

| Method + path | Guards | Purpose |
|---|---|---|
| `GET /health` | — | liveness + DB readiness (unversioned, for probes) |
| `GET /auth/options` | — | `{ selfRegistration }`, for the login screen |
| `POST /auth/register` | rate limit (global), `ALLOW_SELF_REGISTRATION` | create an account (role `user`) and sign in |
| `POST /auth/login` | login rate limiter | sign in |
| `POST /auth/refresh` | CSRF | rotate the session |
| `POST /auth/logout` | auth + CSRF | revoke the session |
| `GET /auth/me` | auth | current user |
| `GET /users?limit&offset` | auth + `users:read` | paginated user list |
| `PUT /users/:id/roles` | auth + CSRF + `roles:manage` | replace a user's roles |
| `GET /roles` | auth + `roles:manage` | assignable roles with permissions |
| `GET /demo/map/states`, `/demo/charts`, `/demo/tables` | auth | demo data (delete for a real project) |

**Rule for new endpoints:** every state-changing route that relies on the session cookie (`POST`/`PUT`/`PATCH`/`DELETE` after sign-in) gets `requireCsrfToken`. The frontend's axios interceptor already sends the header on every mutating request.

**Frontend API consumption**

- `apiClient` unwraps the backend envelope and returns `data`.
- Feature APIs call `apiClient.post/get/put/patch/delete`.
- The low-level HTTP client is `httpClient`, configured with `withCredentials: true`.
- Axios interceptors handle CSRF headers, 401 refresh, and auth session expiration.

---

## How it works in this project

1. Backend route receives a request.
2. If the route expects JSON input, `validateBody(schema)` runs; query strings use `validateQuery(schema)` (parsed result on `req.validatedQuery`).
3. Controller executes and calls `sendSuccess()` on success.
4. If a service throws an `AppError`, `errorHandler` returns a safe error envelope.
5. If an unexpected exception occurs, `errorHandler` returns `500 INTERNAL_ERROR`.
6. Frontend `apiClient` returns the `data` field directly to callers.

---

## Common Tasks

| Task | What to change |
|---|---|
| Add a new endpoint | Add route in `back-end/src/routes/*.ts`, controller, service, repository, and DTO schema |
| Validate request body | Add a Zod schema in `back-end/src/data-transfer-object/` and apply `validateBody(schema)` in the route |
| Protect a state-changing route | `requireAuth, requireCsrfToken, requirePermission("key")` — see `PUT /users/:id/roles` in `user.routes.ts` |
| Add a new frontend API call | Create or update `front-end/src/features/<feature>/api/<name>Api.ts` using `apiClient` |
| Customize error handling | Update `back-end/src/middlewares/errorHandler.ts` and add AppError subclasses in `back-end/src/errors/` |
| Inspect API shape | Check `front-end/src/api/types.ts` and backend response helpers |

---

## Commands

```bash
cd back-end
npm run dev
```

Use the frontend app to call API routes through the browser. Every request is made through the shared `httpClient`.

---

## Related Documents

- [Authentication](../architecture/authentication.md)
- [Security Standards](security.md)
- [Adding an API](../development/adding-api.md)

---

## References

- [Express Documentation](https://expressjs.com/)
- [Zod Documentation](https://zod.dev/)
