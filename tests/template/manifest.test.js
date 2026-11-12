import test from "node:test";
import assert from "node:assert/strict";
import { validateManifest } from "../../src/template/manifest.js";

const valid = {
    name: "test-template",
    schemaVersion: "1.0",
    frontends: [
        { id: "react", path: "front-end/react", default: true },
        { id: "vue", path: "front-end/vue", default: false }
    ],
    backends: [
        { id: "express", path: "back-end/express", default: true },
        { id: "fastapi", path: "back-end/fastapi", default: false }
    ],
    compatibility: {
        react: ["express", "fastapi"],
        vue: ["express"]
    }
};

test("accepts a valid selection manifest", () => assert.equal(validateManifest(valid), valid));
test("accepts legacy manifests without selection fields", () => {
    assert.doesNotThrow(() => validateManifest({ name: "legacy", schemaVersion: "1.0", components: [] }));
});
test("requires both frontend and backend arrays", () => {
    assert.throws(() => validateManifest({ ...valid, backends: undefined }), /must define both/);
});
test("rejects duplicate technology ids", () => {
    const value = structuredClone(valid);
    value.frontends.push({ id: "react", path: "front-end/react2", default: false });
    assert.throws(() => validateManifest(value), /Duplicate technology id/);
});
test("requires exactly one default in each category", () => {
    const value = structuredClone(valid);
    value.backends[1].default = true;
    assert.throws(() => validateManifest(value), /exactly one default technology/);
});
test("rejects paths that escape the template root", () => {
    const value = structuredClone(valid);
    value.frontends[0].path = "../outside";
    assert.throws(() => validateManifest(value), /unsafe path/);
});
test("rejects unknown backend IDs in compatibility", () => {
    const value = structuredClone(valid);
    value.compatibility.react = ["express", "django"];
    assert.throws(() => validateManifest(value), /unknown backend/);
});
test("requires a compatibility entry for every frontend", () => {
    const value = structuredClone(valid);
    delete value.compatibility.vue;
    assert.throws(() => validateManifest(value), /Compatibility for frontend 'vue'/);
});
