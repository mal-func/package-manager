# CDIS Frontend

React + TypeScript + Vite frontend for the CDIS Engineering Template.

This repository was split out of the original `cdis-engineering-template` monorepo. The backend API lives in a sibling repository, [`cdis-backend`](https://github.com/WorkGaurav1/cdis-backend); production deployment topology lives in [`cdis-deployment`](https://github.com/WorkGaurav1/cdis-deployment).

---

## Technology Stack

- React 19 + TypeScript (strict mode) + Vite
- React Router (data router)
- TanStack Query (server state) + TanStack Table
- React Hook Form + Zod
- Axios, with a token-refresh interceptor
- Tailwind CSS
- Recharts (charts) + React-Leaflet (maps)
- Vitest + React Testing Library

---

## Project Structure

```text
src/
├── api/                client (axios instance, interceptors, error normalization)
├── app/                app shell (Sidebar, Navbar, theme), providers, App.tsx entry
├── auth/                auth context/provider, login + register pages, route guards, permission hooks
├── config/              env validation, navigation config
├── features/             one folder per feature module (dashboard, users, charts, graphs, tables, settings)
├── layouts/              ProtectedLayout / PublicLayout
├── lib/                  small app-wide utilities (logger)
├── routes/               route tree, route guards composition
└── shared/                cross-feature components (Chart, Map, DataTable), utils
```

**`dashboard`, `charts`, `graphs`, and `tables` are demonstration content** — backed by literal `/api/v1/demo/...` endpoints, meant to show real, working patterns for maps/charts/tables. Delete or replace them for a new project; see the CDIS Template repo's `docs/development/removing-a-feature.md`. `auth/`, `api/`, and `shared/` are foundational — keep those.

---

## Prerequisites

- Node.js 22+ (`engines` in `package.json`)
- A reachable backend API (see [`cdis-backend`](https://github.com/WorkGaurav1/cdis-backend))

---

## Install

```bash
npm install
cp .env.example .env   # then point it at your backend — see below
```

### Environment variables

All frontend env vars are prefixed `VITE_` and get baked into the build at build time — **never put anything here that shouldn't be visible in the browser** (no secrets; this is a public bundle).

| Variable | Notes |
|---|---|
| `VITE_APP_NAME` | display name — sidebar, sign-in screens, browser tab |
| `VITE_APP_ENV` | `development` \| `testing` \| `staging` \| `production` |
| `VITE_API_BASE_URL` | the backend's `/api/v1` base URL — must match wherever `cdis-backend` is actually running |

---

## Development

```bash
npm run dev       # Vite dev server, default port 5173
```

The backend's `CORS_ORIGIN` must exactly match this dev server's origin for requests to succeed.

---

## Build / Preview

```bash
npm run build      # tsc -b (type-check) && vite build -> dist/
npm run preview    # serve the production build locally, for smoke-testing before deploy
```

---

## Testing

```bash
npm test               # Vitest + React Testing Library, jsdom
npm run test:coverage  # same, with coverage enforcement
```

Coverage thresholds are enforced in `vitest.config.ts`: an 85%/80% global floor, with a 95%/90% bar on security-critical files (`usePermission.ts`, `RequireAuth.tsx`, `RequirePermission.tsx`, `interceptors.ts`).

End-to-end (Playwright) tests that exercise this app against a real running backend live in the [`cdis-deployment`](https://github.com/WorkGaurav1/cdis-deployment) repo, not here — they test the integrated system, not this app in isolation.

---

## Lint

```bash
npm run lint
```

---

## Architecture notes

- **Auth state** lives in `AuthContext`/`AuthProvider` (React Query under the hood for the session-restore call), not Redux/Zustand — there's exactly one piece of global client state that matters (who's logged in), and Context is enough for that.
- **API errors** are normalized to a single `ApiError` shape by `api/client/interceptors.ts` before UI code ever sees them — components never handle raw Axios errors.
- **Registration** (`/register`) is only linked from the sign-in page when the backend reports `selfRegistration: true` (`GET /auth/options`).
- **Users** (account menu, `users:read`) lists accounts; holders of `roles:manage` can change anyone else's roles there.
- **A 401 gets one silent retry** via a refresh-token call before the UI treats the session as expired (see `interceptors.ts`) — concurrent 401s share a single in-flight refresh to avoid tripping the backend's refresh-token reuse detection.

---

## References

- React — https://react.dev
- Vite — https://vite.dev
- TypeScript — https://www.typescriptlang.org
- TanStack Query — https://tanstack.com/query
- React Hook Form — https://react-hook-form.com
- Zod — https://zod.dev
- Axios — https://axios-http.com
