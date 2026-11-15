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
    compatibility: { react: ["express", "fastapi"], vue: ["express"] }
};

async function runPrompt(answers, options = {}) {
    const output = new PassThrough();
    const prompts = [];
    const pending = [...answers];
    const result = await promptForTechnologies(manifest, {
        output, ...options,
        askQuestion: async message => {
            prompts.push(message);
            if (!pending.length) throw new Error("No test answer available.");
            return pending.shift();
        }
    });
    return { result, prompts, output };
}

test("prompts for both technologies and returns selected IDs", async () => {
    const { result, prompts } = await runPrompt(["2", "1"]);
    assert.deepEqual(result, { frontend: "vue", backend: "express" });
    assert.equal(prompts.length, 2);
});
test("filters backend choices using manifest compatibility", async () => {
    const { result, output } = await runPrompt(["2", "1"]);
    assert.deepEqual(result, { frontend: "vue", backend: "express" });
    assert.match(output.read().toString(), /1\) Express/);
    assert.doesNotMatch(output.read()?.toString() || "", /FastAPI/);
});
test("uses defaults when the user presses Enter", async () => {
    const { result } = await runPrompt(["", ""]);
    assert.deepEqual(result, { frontend: "react", backend: "express" });
});
test("prompts only for the technology not supplied as a flag", async () => {
    const { result, prompts } = await runPrompt(["1"], { frontend: "vue" });
    assert.deepEqual(result, { frontend: "vue", backend: "express" });
    assert.equal(prompts.length, 1);
});
test("does not prompt when both choices are supplied", async () => {
    const { result, prompts } = await runPrompt([], { frontend: "vue", backend: "express" });
    assert.deepEqual(result, { frontend: "vue", backend: "express" });
    assert.equal(prompts.length, 0);
});
test("re-prompts after an invalid answer", async () => {
    const { result, prompts } = await runPrompt(["invalid", "1", "1"]);
    assert.deepEqual(result, { frontend: "react", backend: "express" });
    assert.equal(prompts.length, 3);
});
