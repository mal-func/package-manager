import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import {
    selectTemplateFiles,
    downloadSelectedComponents
} from "../../src/template/component-download.js";

const manifest = {
    components: ["front-end", "back-end", "deployment", "docs"],
    files: {
        include: [".gitignore"],
        exclude: [".env", "node_modules", ".git"]
    }
};
const selection = {
    frontend: { id: "vue", path: "front-end/vue" },
    backend: { id: "fastapi", path: "back-end/fastapi" }
};
const tree = [
    { path: "front-end/react/src/App.tsx", type: "blob" },
    { path: "front-end/vue/src/App.vue", type: "blob" },
    { path: "front-end/vue/.env", type: "blob" },
    { path: "front-end/vue/node_modules/pkg/index.js", type: "blob" },
    { path: "back-end/express/src/server.ts", type: "blob" },
    { path: "back-end/fastapi/app/main.py", type: "blob" },
    { path: "deployment/compose/compose.yaml", type: "blob" },
    { path: "deployment/scripts/deploy.sh", type: "blob", mode: "100755" },
    { path: "docs/START-HERE.md", type: "blob" },
    { path: ".gitignore", type: "blob" },
    { path: "README.md", type: "blob" },
    { path: "cdis-template.json", type: "blob" },
    { path: "front-end/vue/link", type: "blob", mode: "120000" }
];

test("selects only requested technologies, shared components and declared root files", () => {
    const selected = selectTemplateFiles(tree, manifest, selection).map(file => file.path);
    assert.deepEqual(selected, [
        "front-end/vue/src/App.vue",
        "back-end/fastapi/app/main.py",
        "deployment/compose/compose.yaml",
        "deployment/scripts/deploy.sh",
        "docs/START-HERE.md",
        ".gitignore"
    ]);
});

test("downloads selected files into their original template paths", async () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "cdis-component-download-"));
    const snapshot = { sha: "abc123", tree };
    const requested = [];
    try {
        const result = await downloadSelectedComponents(
            root, snapshot, manifest, selection,
            {
                concurrency: 3,
                request: async url => {
                    requested.push(url);
                    return { data: Buffer.from(url.split("/").at(-1)) };
                }
            }
        );

        assert.equal(result.downloadedFiles, 6);
        assert.equal(fs.existsSync(path.join(root, "front-end/vue/src/App.vue")), true);
        assert.equal(fs.existsSync(path.join(root, "back-end/fastapi/app/main.py")), true);
        assert.equal(fs.existsSync(path.join(root, "front-end/react/src/App.tsx")), false);
        assert.equal(fs.existsSync(path.join(root, "back-end/express/src/server.ts")), false);
        assert.equal(fs.existsSync(path.join(root, ".gitignore")), true);
        assert.equal((fs.statSync(path.join(root, "deployment/scripts/deploy.sh")).mode & 0o777), 0o755);
        assert.equal(requested.length, 6);
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
});

test("reports an empty selection instead of creating an empty project", async () => {
    await assert.rejects(
        downloadSelectedComponents(
            path.join(os.tmpdir(), "unused-cdis-destination"),
            { sha: "abc", tree: [] },
            manifest,
            selection,
            { request: async () => ({ data: Buffer.from("") }) }
        ),
        /No files matched/
    );
});
