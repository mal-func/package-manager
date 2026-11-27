import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { applyToolingSelection, resolveToolingSelection } from "../../src/template/tooling.js";

const manifest = {
    tooling: {
        frontends: {
            react: { linting: { options: [
                { id: "eslint", default: true },
                { id: "biome", default: false }
            ] } },
            vue: { linting: { options: [
                { id: "eslint", default: true },
                { id: "biome", default: false }
            ] } }
        },
        backends: {
            express: { linting: { options: [
                { id: "eslint", default: true },
                { id: "biome", default: false }
            ] } },
            fastapi: { linting: { options: [
                { id: "ruff", default: true }
            ] } }
        }
    }
};

test("uses declared default linters", () => {
    const result = resolveToolingSelection(manifest, {
        frontend: { id: "react" }, backend: { id: "express" }
    });
    assert.equal(result.frontendLinter, "eslint");
    assert.equal(result.backendLinter, "eslint");
    assert.equal(result.prettier, false);
    assert.equal(result.ruffFormat, false);
});

test("accepts an explicit Biome choice for supported JavaScript projects", () => {
    const result = resolveToolingSelection(manifest, {
        frontend: { id: "vue" }, backend: { id: "express" }
    }, { frontendLinter: "biome", backendLinter: "biome" });
    assert.equal(result.frontendLinter, "biome");
    assert.equal(result.backendLinter, "biome");
});

test("keeps Ruff as the only FastAPI linter without prompting for alternatives", () => {
    const result = resolveToolingSelection(manifest, {
        frontend: { id: "react" }, backend: { id: "fastapi" }
    });
    assert.equal(result.backendLinter, "ruff");
});

test("rejects unsupported linter IDs", () => {
    assert.throws(() => resolveToolingSelection(manifest, {
        frontend: { id: "react" }, backend: { id: "express" }
    }, { frontendLinter: "standard" }), /Unknown frontend linter/);
});

test("optional formatters are disabled unless explicitly selected", () => {
    const result = resolveToolingSelection(manifest, {
        frontend: { id: "react" }, backend: { id: "fastapi" }
    }, { prettier: true, ruffFormat: true });
    assert.equal(result.prettier, true);
    assert.equal(result.ruffFormat, true);
});


test("applies optional Prettier scripts and configuration to generated JavaScript projects", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "cdis-prettier-test-"));
    try {
        const frontend = path.join(root, "front-end/react");
        const backend = path.join(root, "back-end/express");
        for (const directory of [frontend, backend]) {
            fs.mkdirSync(directory, { recursive: true });
            fs.writeFileSync(path.join(directory, "package.json"), JSON.stringify({
                scripts: { lint: "eslint ." },
                devDependencies: { eslint: "^9.0.0" }
            }));
        }

        applyToolingSelection(root, {
            frontend: { id: "react", path: "front-end/react" },
            backend: { id: "express", path: "back-end/express" }
        }, {
            frontendLinter: "eslint",
            backendLinter: "eslint",
            prettier: true,
            ruffFormat: false
        });

        for (const directory of [frontend, backend]) {
            const pkg = JSON.parse(fs.readFileSync(path.join(directory, "package.json"), "utf8"));
            assert.equal(pkg.scripts.format, "prettier --write .");
            assert.equal(pkg.scripts["format:check"], "prettier --check .");
            assert.ok(pkg.devDependencies.prettier);
            assert.equal(fs.existsSync(path.join(directory, ".prettierrc.json")), true);
            assert.equal(fs.existsSync(path.join(directory, ".prettierignore")), true);
            const prettierConfig = JSON.parse(fs.readFileSync(path.join(directory, ".prettierrc.json"), "utf8"));
            assert.equal(prettierConfig.singleQuote, false);
        }
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
});

test("applies Ruff formatting configuration only when selected for FastAPI", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "cdis-ruff-format-test-"));
    try {
        const frontend = path.join(root, "front-end/vue");
        const backend = path.join(root, "back-end/fastapi");
        fs.mkdirSync(frontend, { recursive: true });
        fs.mkdirSync(backend, { recursive: true });
        fs.writeFileSync(path.join(frontend, "package.json"), JSON.stringify({ scripts: {} }));
        fs.writeFileSync(path.join(backend, "pyproject.toml"), "[tool.ruff]\nline-length = 100\n");

        applyToolingSelection(root, {
            frontend: { id: "vue", path: "front-end/vue" },
            backend: { id: "fastapi", path: "back-end/fastapi" }
        }, {
            frontendLinter: "eslint",
            backendLinter: "ruff",
            prettier: false,
            ruffFormat: true
        });

        const pyproject = fs.readFileSync(path.join(backend, "pyproject.toml"), "utf8");
        assert.ok(pyproject.includes("[tool.ruff.format]"));
        assert.ok(pyproject.includes('quote-style = "double"'));
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
});

test("does not add formatter configuration when optional formatters are disabled", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "cdis-no-format-test-"));
    try {
        const frontend = path.join(root, "front-end/react");
        const backend = path.join(root, "back-end/fastapi");
        fs.mkdirSync(frontend, { recursive: true });
        fs.mkdirSync(backend, { recursive: true });
        fs.writeFileSync(path.join(frontend, "package.json"), JSON.stringify({ scripts: {} }));
        fs.writeFileSync(path.join(backend, "pyproject.toml"), "[tool.ruff]\nline-length = 100\n");

        applyToolingSelection(root, {
            frontend: { id: "react", path: "front-end/react" },
            backend: { id: "fastapi", path: "back-end/fastapi" }
        }, {
            frontendLinter: "eslint",
            backendLinter: "ruff",
            prettier: false,
            ruffFormat: false
        });

        assert.equal(fs.existsSync(path.join(frontend, ".prettierrc.json")), false);
        assert.equal(fs.readFileSync(path.join(backend, "pyproject.toml"), "utf8").includes("[tool.ruff.format]"), false);
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
});
