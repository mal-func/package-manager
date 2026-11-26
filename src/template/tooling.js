import fs from "node:fs";
import path from "node:path";

const BIOME_VERSION = "^2.6.9";
const PRETTIER_VERSION = "^3.6.2";

function optionsFor(manifest, area, id, capability) {
    return manifest.tooling?.[area]?.[id]?.[capability]?.options ?? [];
}

function choose(options, requested, label) {
    if (requested !== undefined) {
        const found = options.find(option => option.id === requested);
        if (!found) {
            throw new Error(`Unknown ${label} '${requested}'. Available options: ${options.map(option => option.id).join(", ")}.`);
        }
        return found.id;
    }
    return options.find(option => option.default === true)?.id ?? options[0]?.id ?? null;
}

export function resolveToolingSelection(manifest, technologySelection, requested = {}) {
    const frontendOptions = optionsFor(manifest, "frontends", technologySelection.frontend.id, "linting");
    const backendOptions = optionsFor(manifest, "backends", technologySelection.backend.id, "linting");
    return {
        frontendLinter: choose(frontendOptions, requested.frontendLinter, "frontend linter"),
        backendLinter: choose(backendOptions, requested.backendLinter, "backend linter"),
        prettier: requested.prettier === true,
        ruffFormat: requested.ruffFormat === true
    };
}

function readPackage(packagePath) {
    if (!fs.existsSync(packagePath)) {
        throw new Error(`Cannot configure developer tooling because '${packagePath}' is missing.`);
    }
    return JSON.parse(fs.readFileSync(packagePath, "utf8"));
}

function writePackage(packagePath, value) {
    fs.writeFileSync(packagePath, `${JSON.stringify(value, null, 2)}\n`);
}

function useBiome(projectDirectory) {
    const packagePath = path.join(projectDirectory, "package.json");
    const packageJson = readPackage(packagePath);
    packageJson.devDependencies ??= {};
    for (const name of Object.keys(packageJson.devDependencies)) {
        if (name === "eslint" || name === "@eslint/js" || name === "globals" ||
            name === "typescript-eslint" || name.startsWith("eslint-") ||
            name.startsWith("@typescript-eslint/")) {
            delete packageJson.devDependencies[name];
        }
    }
    packageJson.devDependencies["@biomejs/biome"] = BIOME_VERSION;
    packageJson.scripts ??= {};
    packageJson.scripts.lint = "biome lint .";
    writePackage(packagePath, packageJson);

    for (const name of ["eslint.config.js", "eslint.config.mjs", ".eslintrc", ".eslintrc.json"]) {
        const configPath = path.join(projectDirectory, name);
        if (fs.existsSync(configPath)) fs.rmSync(configPath, { force: true });
    }
    fs.writeFileSync(path.join(projectDirectory, "biome.json"), `${JSON.stringify({
        "$schema": "https://biomejs.dev/schemas/2.6.9/schema.json",
        "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
        "files": { "ignoreUnknown": true },
        "linter": { "enabled": true, "rules": { "recommended": true } },
        "formatter": { "enabled": false }
    }, null, 2)}\n`);
    removeLockfile(projectDirectory);
}

function addPrettier(projectDirectory) {
    const packagePath = path.join(projectDirectory, "package.json");
    const packageJson = readPackage(packagePath);
    packageJson.devDependencies ??= {};
    packageJson.devDependencies.prettier = PRETTIER_VERSION;
    packageJson.scripts ??= {};
    packageJson.scripts.format = "prettier --write .";
    packageJson.scripts["format:check"] = "prettier --check .";
    writePackage(packagePath, packageJson);
    fs.writeFileSync(path.join(projectDirectory, ".prettierrc.json"), `${JSON.stringify({
        "semi": true,
        "singleQuote": true,
        "trailingComma": "all",
        "printWidth": 100
    }, null, 2)}\n`);
    fs.writeFileSync(path.join(projectDirectory, ".prettierignore"), "node_modules\ndist\ncoverage\n");
    removeLockfile(projectDirectory);
}

function removeLockfile(projectDirectory) {
    const lockPath = path.join(projectDirectory, "package-lock.json");
    if (fs.existsSync(lockPath)) fs.rmSync(lockPath, { force: true });
}

function enableRuffFormat(projectDirectory) {
    const pyprojectPath = path.join(projectDirectory, "pyproject.toml");
    if (!fs.existsSync(pyprojectPath)) {
        throw new Error(`Cannot enable Ruff formatting because '${pyprojectPath}' is missing.`);
    }
    let content = fs.readFileSync(pyprojectPath, "utf8");
    if (!/^\[tool\.ruff\.format\]/m.test(content)) {
        content = content.trimEnd() + "\n\n[tool.ruff.format]\nquote-style = \"double\"\n";
    }
    fs.writeFileSync(pyprojectPath, content);
}

export function applyToolingSelection(destination, technologySelection, toolingSelection) {
    const frontendDirectory = path.join(destination, technologySelection.frontend.path);
    const backendDirectory = path.join(destination, technologySelection.backend.path);

    if (toolingSelection.frontendLinter === "biome") useBiome(frontendDirectory);
    if (toolingSelection.backendLinter === "biome") useBiome(backendDirectory);
    if (toolingSelection.prettier) {
        addPrettier(frontendDirectory);
        if (technologySelection.backend.id === "express") addPrettier(backendDirectory);
    }
    if (toolingSelection.ruffFormat && technologySelection.backend.id === "fastapi") {
        enableRuffFormat(backendDirectory);
    }
}
