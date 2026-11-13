import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import {
    fetchTemplateSnapshot,
    downloadSelectedComponents
} from "../../src/template/component-download.js";
import { validateManifest } from "../../src/template/manifest.js";
import { resolveTechnologySelection } from "../../src/template/selection.js";

test("downloads selected files from a real GitHub template snapshot", {
    skip: process.env.CDIS_LIVE_TESTS !== "1",
    timeout: 120000
}, async () => {
    const snapshot = await fetchTemplateSnapshot("main", "heads");
    const manifest = validateManifest(snapshot.manifest);
    const selection = resolveTechnologySelection(manifest);

    const selected = [
        ...snapshot.tree.filter(entry =>
            entry.type === "blob" &&
            (entry.path.startsWith(selection.frontend.path + "/") ||
             entry.path.startsWith(selection.backend.path + "/"))
        )
    ];
    assert.ok(selected.length > 0, "selected technology paths should contain files");
    assert.equal(selected.some(file => file.path.startsWith("front-end/vue/")), false);
    assert.equal(selected.some(file => file.path.startsWith("back-end/fastapi/")), false);

    const temp = fs.mkdtempSync(path.join(os.tmpdir(), "cdis-live-download-"));
    try {
        // Fetch one declared root file to verify the raw-content download path
        // without downloading hundreds of files during every CI run.
        const smokeManifest = {
            ...manifest,
            components: [],
            files: { include: ["README.md"], exclude: [] }
        };
        const result = await downloadSelectedComponents(
            temp,
            snapshot,
            smokeManifest,
            selection
        );
        assert.equal(result.downloadedFiles, 1);
        assert.match(fs.readFileSync(path.join(temp, "README.md"), "utf8"), /CDIS Engineering Template/);
    } finally {
        fs.rmSync(temp, { recursive: true, force: true });
    }
});
