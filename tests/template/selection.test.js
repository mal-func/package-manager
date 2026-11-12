import test from "node:test";
import assert from "node:assert/strict";
import { resolveTechnologySelection } from "../../src/template/selection.js";

const manifest = {
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
    compatibility: { react: ["express", "fastapi"], vue: ["express"] }
};

test("uses React and Express defaults", () => {
    const result = resolveTechnologySelection(manifest);
    assert.equal(result.frontend.id, "react");
    assert.equal(result.backend.id, "express");
    assert.equal(result.compatibilityChecked, true);
});
test("resolves explicit IDs to manifest paths", () => {
    const result = resolveTechnologySelection(manifest, { frontend: "vue", backend: "express" });
    assert.equal(result.frontend.path, "front-end/vue");
    assert.equal(result.backend.path, "back-end/express");
});
test("rejects unknown frontend IDs", () => {
    assert.throws(() => resolveTechnologySelection(manifest, { frontend: "angular" }), /Unknown frontend 'angular'/);
});
test("rejects unknown backend IDs", () => {
    assert.throws(() => resolveTechnologySelection(manifest, { backend: "django" }), /Unknown backend 'django'/);
});
test("rejects unsupported combinations", () => {
    assert.throws(() => resolveTechnologySelection(manifest, { frontend: "vue", backend: "fastapi" }), /is not supported/);
});
test("allows migration manifests without compatibility rules but reports unchecked status", () => {
    const legacy = { ...manifest };
    delete legacy.compatibility;
    const result = resolveTechnologySelection(legacy, { frontend: "vue", backend: "fastapi" });
    assert.equal(result.compatibilityChecked, false);
});
