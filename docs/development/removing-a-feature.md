# Removing a Feature

Deleting one of the pluggable frontend features — most commonly the demo content (dashboard/charts/graphs/tables) a new project doesn't need.

---

## Purpose

The exact cleanup for removing a feature folder without leaving dead imports or a broken build.

---

## Location

- `front-end/src/features/<name>/` — the folder to delete
- `front-end/src/routes/protectedRoutes.tsx` — its `featureModules` array (every feature's route)
- `front-end/src/config/navigation/navigationConfig.ts` — its own, separate `featureModules` array (sidebar entries only)

---

## Workflow

`protectedRoutes.tsx` and `navigationConfig.ts` each keep their **own** `featureModules` array — they're not the same array. Every feature is listed in `protectedRoutes.tsx` (it needs a route), but not every feature is listed in `navigationConfig.ts` — `users` and `settings`, for example, are routed but deliberately have no sidebar entry (Settings is linked from the account menu instead). Check both, remove from whichever actually lists it.

Tests are colocated inside the feature folder (`features/<name>/**/*.test.tsx`), so deleting the folder removes its tests automatically — nothing extra to clean up there.

---

## Common Tasks

| Step | File |
|---|---|
| 1. Delete the folder | `rm -rf front-end/src/features/<name>/` |
| 2. Remove its entry | `front-end/src/routes/protectedRoutes.tsx`'s `featureModules` array |
| 3. Remove its entry, if present | `front-end/src/config/navigation/navigationConfig.ts`'s `featureModules` array (not every feature is in here — see Workflow above) |
| 4. Confirm nothing else imports it | `grep -rn "features/<name>" front-end/src` — should return nothing |
| 5. Verify | `cd front-end && npx tsc -b && npm run test` |

If the feature also has its own backend endpoints (the demo features do — `/api/v1/demo/...`), remove the matching route/controller/service/repository files in `back-end/src/` too, and drop the corresponding Prisma models from `back-end/prisma/schema.prisma` — see [Adding a Database Change](adding-a-db-change.md) for the migration side of removing a model.

**Removing all the demo content** also means:
- `back-end/prisma/seed.ts` — delete the `seedDemo*` functions and their calls in `main()` (they write to the dropped models);
- `back-end/src/app.test.ts` — the "mounts the demo router" test;
- `deployment/e2e/navigation.spec.ts` — the Graphs/Charts/Table sidebar tests, and `helpers.ts`'s `loginAs`, which waits for `/dashboard` (point it at your new landing page);
- `front-end/src/auth/components/HomeRedirect.tsx` / `RedirectIfAuthenticated.tsx` — they send signed-in users to `/dashboard`;
- `front-end/public/data/` — the India GeoJSON used only by the dashboard maps.

---

## Related Documents

- [Adding a Feature](adding-feature.md)
- [Adding a Database Change](adding-a-db-change.md)
- [Project Structure](../architecture/project-structure.md)

---

## References

- [React Router Documentation](https://reactrouter.com/)
