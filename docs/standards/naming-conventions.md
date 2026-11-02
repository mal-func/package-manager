# Naming Conventions

Patterns observed consistently across both apps — not aspirational rules.

---

## Purpose

How files, folders, and identifiers are actually named in this codebase, so new code matches.

---

## Workflow

**Backend** — one file per layer, per resource, dot-segmented:
```
<resource>.controller.ts
<resource>.service.ts
<resource>.repository.ts
<resource>.routes.ts
<resource>.dto.ts
```
e.g. `auth.controller.ts`, `user.service.ts`, `refreshToken.repository.ts`. Class-only files (e.g. `AppError.ts`) are PascalCase, matching the class they export. Only `config/`, `errors/` and `routes/` have an `index.ts` barrel; everything else is imported by file path.

**Frontend**
| What | Convention | Example |
|---|---|---|
| React component file | PascalCase | `LoginForm.tsx`, `RequireAuth.tsx` |
| Non-component `.ts` file | camelCase | `authApi.ts`, `apiClient.ts` |
| Multi-word constants/types/schemas | `<domain>.<kind>.ts` | `auth.constants.ts`, `auth.types.ts`, `loginSchema.ts` |
| Feature module descriptor | `<feature>.module.tsx` | `users.module.tsx` (route + nav registration — see [Adding a Feature](../development/adding-feature.md)) |
| Folders | lowercase, camelCase if multi-word | `api/`, `components/`, `usersTableColumns.ts` |
| Barrel export | `index.ts` in every folder that's imported from elsewhere | |

**Cross-cutting**
- Route path segments: lowercase, single word so far (`dashboard`, `users`, `login`) — no multi-word segment exists yet to confirm a kebab-case convention, but that's the natural extension if one is needed.
- Permission keys: `resource:action` (`users:read`, `users:write`, `roles:manage`).
- Env vars: `SCREAMING_SNAKE_CASE`, frontend ones prefixed `VITE_`.

---

## Common Tasks

| Adding... | Name it |
|---|---|
| A new backend resource | `<name>.controller.ts` / `.service.ts` / `.repository.ts` / `.routes.ts` / `.dto.ts` |
| A new frontend component | PascalCase `.tsx` |
| A new feature | `features/<name>/`, module file `<name>.module.tsx` |
| A new permission | `<resource>:<action>` in `seed.ts` |

---

## Related Documents

- [Project Structure](../architecture/project-structure.md)
- [Code Style](code-style.md)

---

## References

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
