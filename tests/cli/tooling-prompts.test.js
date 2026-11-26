import test from "node:test";
import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import { promptForTooling } from "../../src/cli/prompts.js";

const manifest = {
    tooling: {
        frontends: { react: { linting: { options: [
            { id: "eslint", name: "ESLint", default: true },
            { id: "biome", name: "Biome", default: false }
        ] } } },
        backends: { express: { linting: { options: [
            { id: "eslint", name: "ESLint", default: true },
            { id: "biome", name: "Biome", default: false }
        ] } }, fastapi: { linting: { options: [
            { id: "ruff", name: "Ruff", default: true }
        ] } } }
    }
};

async function run(answers, backend = "express") {
    const pending = [...answers];
    const output = new PassThrough();
    const prompts = [];
    const result = await promptForTooling(manifest, {
        frontend: { id: "react" }, backend: { id: backend }
    }, {
        output,
        askQuestion: async message => {
            prompts.push(message);
            if (!pending.length) throw new Error("No test answer available.");
            return pending.shift();
        }
    });
    return { result, prompts, output: output.read()?.toString() ?? "" };
}

test("offers lint alternatives and optional formatting choices", async () => {
    const { result, prompts } = await run(["2", "1", "y"]);
    assert.equal(result.frontendLinter, "biome");
    assert.equal(result.backendLinter, "eslint");
    assert.equal(result.prettier, true);
    assert.equal(result.ruffFormat, false);
    assert.equal(prompts.length, 3);
});

test("does not ask for a linter choice when only one is declared", async () => {
    const { result, prompts } = await run(["n", "n"], "fastapi");
    assert.equal(result.backendLinter, "ruff");
    assert.equal(prompts.length, 2);
});
