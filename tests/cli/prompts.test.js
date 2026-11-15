import test from "node:test";
import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import { promptForTechnologies } from "../../src/cli/prompts.js";

const manifest = {
    frontends: [
        { id: "react", name: "React", default: true },
        { id: "vue", name: "Vue", default: false }
    ],
    backends: [
        { id: "express", name: "Express", default: true },
        { id: "fastapi", name: "FastAPI", default: false }
    ],
    compatibility: {
        react: ["express", "fastapi"],
        vue: ["express"]
    }
};

async function runPrompt(answers, options = {}) {
    const input = new PassThrough();
    const output = new PassThrough();
    const resultPromise = promptForTechnologies(manifest, { input, output, ...options });
    input.end(answers);
    return resultPromise;
}

test("prompts for both technologies and returns the selected IDs", async () => {
    const result = await runPrompt("2\n1\n");
    assert.deepEqual(result, { frontend: "vue", backend: "express" });
});

test("filters backend choices using manifest compatibility", async () => {
    const result = await runPrompt("2\n1\n");
    assert.deepEqual(result, { frontend: "vue", backend: "express" });
});

test("uses defaults when the user presses Enter", async () => {
    const result = await runPrompt("\n\n");
    assert.deepEqual(result, { frontend: "react", backend: "express" });
});

test("prompts only for the technology not supplied as a flag", async () => {
    const result = await runPrompt("2\n", { frontend: "vue" });
    assert.deepEqual(result, { frontend: "vue", backend: "express" });
});

test("does not create a prompt when both choices are supplied", async () => {
    const result = await runPrompt("", { frontend: "vue", backend: "express" });
    assert.deepEqual(result, { frontend: "vue", backend: "express" });
});
