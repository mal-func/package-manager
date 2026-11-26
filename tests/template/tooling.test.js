import test from "node:test";
import assert from "node:assert/strict";
import { resolveToolingSelection } from "../../src/template/tooling.js";

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
