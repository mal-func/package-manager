# Adding a Feature

A frontend feature is a self-contained folder that registers its own route + nav entry via a `FeatureModule`.

---

## Purpose

Steps to add a new pluggable frontend feature (a sidebar page), using the existing `users` feature as the reference.

---

## Location

- `front-end/src/config/navigation/featureModule.ts` — the `FeatureModule` type
- `front-end/src/routes/protectedRoutes.tsx` — where every feature's route is registered
- `front-end/src/config/navigation/navigationConfig.ts` — where every feature's sidebar entry is derived from the same list
- Reference example: `front-end/src/features/users/`

---

## Workflow

```
features/<name>/
├── api/<name>Api.ts     # own fetch calls via apiClient — never import another feature's api/
├── pages/<Name>Page.tsx
├── <name>.module.tsx    # exports a FeatureModule: { segment, path, element, label, icon, permission? }
└── index.ts             # re-exports the page + the module
```

`protectedRoutes.tsx` and `navigationConfig.ts` each keep their own `featureModules` array — every feature needs a route (`protectedRoutes.tsx`), but not every feature gets a sidebar entry (`users`/`settings` are deliberately routed-but-not-in-nav; both are reached from the account menu in `app/shell/ProfileMenu.tsx`, Users only for `users:read` holders). List a new feature in `protectedRoutes.tsx` always, and in `navigationConfig.ts` only if it should appear in the sidebar. See [Removing a Feature](removing-a-feature.md) for the reverse of this.

---

## Common Tasks

| Step | File |
|---|---|
| 1. Create the folder | `features/<name>/` |
| 2. Build the page | `features/<name>/pages/<Name>Page.tsx` |
| 3. Add its own data fetch | `features/<name>/api/<name>Api.ts` (calls `apiClient`, not another feature) |
| 4. Describe the route + nav entry | `features/<name>/<name>.module.tsx` |
| 5. Export both | `features/<name>/index.ts` |
| 6. Register | add the module to `routes/protectedRoutes.tsx`'s `featureModules` array (always); add it to `config/navigation/navigationConfig.ts`'s `featureModules` array too, only if it should show up in the sidebar |
| Gate it behind a permission | set `permission: "resource:action"` on the `FeatureModule` — both the route and the nav link respect it automatically |

---

## Related Documents

- [Project Structure](../architecture/project-structure.md)
- [Authorization](../architecture/authorization.md)
- [Adding an API](adding-api.md)
- [Removing a Feature](removing-a-feature.md)

---

## References

- [React Router Documentation](https://reactrouter.com/)
