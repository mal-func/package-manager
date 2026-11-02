# CDIS Git Standards

> Version: 1.0
> Status: Approved
> Applies To: All CDIS Engineering Projects

---

# Purpose

This document defines the Git workflow, branching strategy, commit conventions, pull request process, and repository standards for all CDIS engineering projects.

The goal is to ensure that every engineer follows a consistent and predictable Git workflow regardless of the project.

---

# Objectives

The Git workflow should provide:

- Clean commit history
- Safe collaboration
- Easy code reviews
- Reliable releases
- Easy rollback
- Traceable changes

---

# Engineering Principles

Every commit should be:

- Small
- Atomic
- Reversible
- Meaningful
- Traceable

Git history is documentation.

---

# Branching Strategy

## Main Branch

```
main
```

Purpose

- Production-ready code
- Always deployable
- Protected branch

Rules

- No direct commits
- Pull Request required
- CI must pass
- Code review required

---

## Development Branch

```
develop
```

Purpose

Integration branch for upcoming releases.

Rules

- Feature branches merge here first.
- Only reviewed code.

---

## Feature Branches

Naming Convention

```
feature/<feature-name>
```

Examples

```
feature/authentication

feature/login-page

feature/dashboard

feature/api-client
```

Rules

- One feature per branch
- Delete after merge

---

## Bug Fix Branches

Naming

```
bugfix/<issue-name>
```

Example

```
bugfix/login-validation

bugfix/sidebar-overflow
```

---

## Hotfix Branches

Naming

```
hotfix/<issue-name>
```

Example

```
hotfix/login-crash

hotfix/security-patch
```

Rules

- Created from main
- Merged back into main and develop

---

# Commit Standards

Every commit should represent one logical change.

Good

```
feat(auth): implement login service

fix(api): handle unauthorized response

refactor(routes): simplify router configuration

docs(git): add branching strategy

test(auth): add login tests
```

Bad

```
fixed stuff

changes

final

update

misc

work

temp
```

---

# Commit Message Format

```
<type>(scope): short description
```

Example

```
feat(auth): add authentication service

fix(routes): redirect unauthorized users

docs(api): update README

refactor(shared): simplify button component

test(auth): add login unit tests

build(ci): configure GitHub Actions
```

---

# Commit Types

| Type | Purpose |
|--------|----------|
| feat | New feature |
| fix | Bug fix |
| docs | Documentation |
| style | Formatting only |
| refactor | Internal improvement |
| perf | Performance improvement |
| test | Tests |
| build | Build system |
| ci | CI/CD |
| chore | Maintenance |
| revert | Revert commit |

---

# Branch Lifecycle

```
develop
      │
      ▼
feature/auth
      │
      ▼
Commit
      │
      ▼
Push
      │
      ▼
Pull Request
      │
      ▼
Code Review
      │
      ▼
CI
      │
      ▼
Merge
```

---

# Pull Request Standards

Every Pull Request should:

- Solve one problem
- Be easy to review
- Build successfully
- Pass all tests
- Include documentation updates if required

---

# Pull Request Checklist

Before opening a Pull Request verify:

- Code builds successfully
- TypeScript passes
- ESLint passes
- Tests pass
- Documentation updated
- No console errors
- No commented-out code
- No debug statements
- No unused imports

---

# Code Review Standards

Every reviewer should verify:

Architecture

- Correct layer
- Correct dependency direction
- No circular dependencies

Code Quality

- Readability
- Naming
- Simplicity

Security

- No secrets
- Input validation
- Authentication respected

Performance

- No unnecessary renders
- Efficient API calls

Documentation

- README updated if necessary
- ADR updated if architecture changed

---

# Merge Strategy

Preferred

```
Squash and Merge
```

Reasons

- Cleaner history
- Easier rollback
- One commit per feature

Avoid

```
Merge Commit
```

unless preserving branch history is required.

---

# Rebase Policy

Before opening a Pull Request

```
git fetch origin

git rebase origin/develop
```

Resolve conflicts locally.

Never force push shared branches without team approval.

---

# Protected Branch Rules

Main

- No direct push
- Pull Request required
- CI required
- Review required

Develop

- Pull Request required
- CI required

---

# Tagging Strategy

Release tags

```
v1.0.0

v1.1.0

v1.2.0
```

Follow Semantic Versioning.

---

# Semantic Versioning

```
MAJOR.MINOR.PATCH
```

Example

```
2.5.1
```

Major

Breaking changes.

Minor

Backward-compatible features.

Patch

Bug fixes.

---

# Repository Hygiene

Never commit

```
node_modules

.env

dist

coverage

logs

tmp

.cache
```

Always maintain a proper `.gitignore`.

---

# Large Files

Do not commit:

- Model files
- Database dumps
- Generated artifacts
- Build outputs

Use appropriate artifact storage when required.

---

# Secrets Management

Never commit

- API keys
- Tokens
- Passwords
- Private certificates
- Database credentials

Use environment variables.

---

# Git History Standards

History should tell the story of development.

Good history

```
feat(auth): add login page

feat(auth): add login service

feat(auth): add authentication guard

test(auth): add login tests

docs(auth): document authentication platform
```

Poor history

```
update

fix

work

done

again

temp
```

---

# Conflict Resolution

Always

- Pull latest changes
- Rebase
- Resolve locally
- Build again
- Test again

Never merge unresolved conflicts.

---

# Release Checklist

Before every release

- Build passes
- Tests pass
- Documentation updated
- Version updated
- Changelog updated
- Security review completed

---

# Git Hooks

> **In this repo today:** no git hooks are installed and there is no Prettier config (see [Code Style](code-style.md)). The same checks run in CI on every push and PR instead. The list below is the recommended setup if your project adds hooks.

Recommended hooks

Pre-commit

- ESLint
- Prettier
- TypeScript check

Pre-push

- Unit tests
- Build verification

---

# Continuous Integration

Every Pull Request should automatically run

- Install dependencies
- Type check
- ESLint
- Tests
- Production build

Merge should be blocked if any step fails.

---

# Common Git Commands

Clone

```bash
git clone <repository-url>
```

Create Feature Branch

```bash
git checkout develop

git pull origin develop

git checkout -b feature/login
```

Commit

```bash
git add .

git commit -m "feat(auth): implement login service"
```

Push

```bash
git push origin feature/login
```

Rebase

```bash
git fetch origin

git rebase origin/develop
```

---

# Git Anti-Patterns

Never

- Commit directly to main
- Force push protected branches
- Commit secrets
- Commit build artifacts
- Commit generated files
- Create giant Pull Requests
- Mix unrelated changes in one commit
- Leave merge conflicts unresolved
- Push broken builds
- Ignore failing CI

---

# Definition of Done

A Git change is complete only if

- Branch follows naming standards
- Commits follow conventions
- Pull Request created
- Code reviewed
- CI passed
- Documentation updated
- Branch deleted after merge

---

# Engineering Rule

> **Git is not just version control—it is the engineering history of the project. Every commit should help the next engineer understand what changed, why it changed, and how it evolved.**