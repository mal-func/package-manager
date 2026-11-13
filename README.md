# CDIS CLI

CDIS CLI generates a CDIS project from the canonical [CDIS engineering template](https://github.com/mal-func/cdis-template-edit).

## Requirements

- Node.js 22 or newer
- npm

## Run locally

```bash
npm ci
node bin/cdis.js help
```

After installing the package globally, use the same commands with `cdis`.

## Commands

| Command | Purpose |
| --- | --- |
| `cdis create <project-name>` | Generate a project using manifest defaults |
| `cdis create <name> --frontend <id> --backend <id>` | Select frontend and backend implementations |
| `cdis template versions` | List published template tags |
| `cdis template info` | Show template metadata and technology options |
| `cdis template options` | Show selectable frontend/backend IDs and declared compatibility |
| `cdis version` | Show CLI version |
| `cdis help` | Show command help |

Use `--version <tag>` to select a release or `--branch <branch>` to use a development branch. They are mutually exclusive.

Examples:

```bash
cdis create portal
cdis create portal --frontend vue --backend express
cdis create portal --frontend react --backend fastapi --branch main
cdis template versions
cdis template info --branch main
cdis template options --version v1.0.0
cdis create --help
```

When technology IDs are omitted, the CLI selects the options marked `"default": true` in the manifest.

## Template manifest contract

Technology choices are data, not hardcoded CLI values. The CLI reads `cdis-template.json` and resolves each selected ID to its directory path.

```json
{
  "frontends": [
    { "id": "react", "path": "front-end/react", "default": true },
    { "id": "vue", "path": "front-end/vue", "default": false }
  ],
  "backends": [
    { "id": "express", "path": "back-end/express", "default": true },
    { "id": "fastapi", "path": "back-end/fastapi", "default": false }
  ],
  "compatibility": {
    "react": ["express"],
    "vue": ["express"]
  },
  "components": ["front-end", "back-end", "deployment", "docs"],
  "files": {
    "include": [".gitignore"],
    "exclude": [".git", "node_modules", "coverage", ".env", ".env.local"]
  }
}
```

- Every technology ID must be unique within its category.
- Each technology category must declare exactly one default.
- Frontend paths must live under `front-end/`; backend paths under `back-end/`.
- `components` declares shared directories to include. The `front-end` and `back-end` entries are category containers; the CLI downloads only the selected implementation paths beneath them.
- `files.include` declares individual root-level files or extra paths to include in addition to the selected implementations and shared directories.
- `files.exclude` lists path segments to omit anywhere in the selected tree.
- `compatibility` maps each frontend ID to backend IDs supported with it. Only combinations verified by template maintainers should be listed.

For a migration manifest without compatibility rules, the CLI currently allows the combination but warns that it has not been validated.

## How component-level downloading works

For a modern manifest with frontend and backend options, the CLI does not download a repository ZIP.

1. It resolves the selected branch or tag to an immutable Git commit SHA.
2. It downloads the manifest and Git tree for that exact commit.
3. It selects files beneath the chosen frontend path, chosen backend path, shared component paths, and paths declared in `files.include`.
4. It removes files matching `files.exclude` and does not follow symbolic links.
5. It downloads only those selected file contents from GitHub's raw-content endpoint, with bounded concurrency and retries.
6. It writes each file into the same relative path in the generated project.
7. It writes a project README describing the selected stack.

Resolving the ref to a commit SHA ensures the manifest, file list and file contents all come from the same repository snapshot even if the branch moves during generation.

The Git tree API returns paths and blob metadata; it does not return the contents of every file. The CLI therefore fetches only the selected file contents. This uses more HTTP requests than a ZIP download, but transfers fewer irrelevant files and avoids downloading alternative implementations.

Older manifests without technology option arrays retain a legacy ZIP fallback for backward compatibility.

## Tests

```bash
npm test
```
