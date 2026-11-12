# CDIS CLI

CDIS CLI generates projects from the [CDIS engineering template](https://github.com/mal-func/cdis-template-edit).

## Requirements

- Node.js 22 or newer
- npm

## Install dependencies

```bash
npm ci
```

During development, run the CLI with:

```bash
node bin/cdis.js help
```

## Create a project

Use the template's manifest defaults:

```bash
node bin/cdis.js create my-project
```

Choose implementations explicitly:

```bash
node bin/cdis.js create my-project --frontend vue --backend express
```

Use a tagged template release:

```bash
node bin/cdis.js create my-project --version v1.0.0
```

Use a branch while developing the template and CLI together:

```bash
node bin/cdis.js create my-project --frontend vue --backend fastapi --branch feat/vue-frontend-parity
```

When technology IDs are omitted, the CLI uses the entries marked `"default": true` in the template manifest. The current template branch marks React and Express as defaults.

## Template manifest contract

The CLI reads the existing `cdis-template.json`. Technology options are declared as arrays:

```json
{
  "schemaVersion": "1.0",
  "name": "cdis-engineering-template",
  "frontends": [
    {
      "id": "react",
      "path": "front-end/react",
      "default": true
    },
    {
      "id": "vue",
      "path": "front-end/vue",
      "default": false
    }
  ],
  "backends": [
    {
      "id": "express",
      "path": "back-end/express",
      "default": true
    },
    {
      "id": "fastapi",
      "path": "back-end/fastapi",
      "default": false
    }
  ],
  "compatibility": {
    "react": ["express"],
    "vue": ["express"]
  },
  "components": [
    "front-end",
    "back-end",
    "deployment",
    "docs"
  ],
  "files": {
    "exclude": [".git", "node_modules", "coverage", ".env", ".env.local"]
  }
}
```

Rules:

- Every technology ID must be unique within its category.
- Each category must declare exactly one default.
- Paths are relative to the template archive root and cannot traverse outside it.
- Compatibility maps a frontend ID to the backend IDs supported with it.
- When compatibility is declared, every frontend must have a non-empty list containing only known backend IDs.
- During the current schema transition, a manifest without `compatibility` is accepted with a CLI warning. Such a combination has not been compatibility-validated.
- Older manifests without `frontends` and `backends` retain the legacy full-template extraction behavior.

The compatibility map should list only combinations the template maintainers have verified and intend to support.

## Project assembly

The CLI downloads the selected template tag or branch as a ZIP into a temporary staging directory. It then:

1. Extracts the archive into staging.
2. Reads and validates `cdis-template.json`.
3. Resolves the selected technology IDs to manifest paths.
4. Copies only those frontend and backend directories.
5. Copies the shared components listed in `components`.
6. Writes a project README identifying the selected stack.
7. Removes staging files.

The generated project retains paths such as `front-end/vue` and `back-end/express`, which are also used by the template's deployment configuration.

## Template information

```bash
node bin/cdis.js template versions
node bin/cdis.js template info --version v1.0.0
```

## Tests

```bash
npm test
```
