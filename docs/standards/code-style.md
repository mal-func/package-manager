# Code Style

This repo uses ESLint + TypeScript strict mode in both apps. There is no shared Prettier configuration, so formatting is not automatically enforced.

---

## Purpose

Document the actual linting and type-checking behavior in this repository.

---

## Location

| Piece | File |
|---|---|
| Frontend lint config | `front-end/eslint.config.js` |
| Backend lint config | `back-end/eslint.config.js` |
| Frontend TS config | `front-end/tsconfig.app.json` |
| Backend TS config | `back-end/tsconfig.json` |

---

## What's enforced

- Both apps enable `strict: true`.
- Common TypeScript options are enabled in both configs, including `noUnusedLocals`, `noUnusedParameters`, and `noFallthroughCasesInSwitch`.
- Frontend ESLint includes React and React Hooks support.
- Backend ESLint allows intentionally unused callback args prefixed with `_`.

---

## Workflow

- Frontend: `cd front-end && npm run lint`
- Backend: `cd back-end && npm run lint`
- Frontend type check: `cd front-end && npx tsc -b`
- Backend type check: `cd back-end && npm run build` (backend `build` is currently a `tsc --noEmit` type check)

Run lint and type-check before pushing changes.

---

## Related documents

- [Naming Conventions](naming-conventions.md)
- [Testing Standards](testing.md)

---

## References

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript ESLint](https://typescript-eslint.io/)
