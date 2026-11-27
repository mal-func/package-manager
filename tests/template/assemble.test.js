import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { assembleTemplate, writeProjectReadme } from "../../src/template/assemble.js";

test("assembles only selected technology paths and shared components", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "cdis-assemble-test-"));
    const template = path.join(root, "template");
    const output = path.join(root, "output");
    try {
        for (const directory of [
            "front-end/react", "front-end/vue", "back-end/express",
            "back-end/fastapi", "deployment", "docs"
        ]) fs.mkdirSync(path.join(template, directory), { recursive: true });

        fs.writeFileSync(path.join(template, "front-end/react", "react.txt"), "react");
        fs.writeFileSync(path.join(template, "front-end/vue", "vue.txt"), "vue");
        fs.writeFileSync(path.join(template, "back-end/express", "express.txt"), "express");
        fs.writeFileSync(path.join(template, "back-end/fastapi", "fastapi.txt"), "fastapi");
        fs.writeFileSync(path.join(template, "front-end/vue", "README.md"), "Vue guide");
        fs.writeFileSync(path.join(template, "back-end/express", "README.md"), "Express guide");
        fs.writeFileSync(path.join(template, "deployment", "README.md"), "Deployment guide");
        fs.writeFileSync(path.join(template, "deployment", "compose.yml"), "services: {}");
        fs.writeFileSync(path.join(template, "docs", "guide.md"), "guide");
        fs.writeFileSync(path.join(template, "README.md"), "template readme");
        fs.writeFileSync(path.join(template, "cdis-template.json"), "{}");

        const manifest = {
            name: "test-template",
            schemaVersion: "1.0",
            components: ["front-end", "back-end", "deployment", "docs"],
            files: { exclude: [".env", "node_modules"] }
        };
        assembleTemplate(template, output, manifest, {
            frontend: { id: "vue", path: "front-end/vue" },
            backend: { id: "express", path: "back-end/express" }
        }, "sample-project");

        assert.equal(fs.readFileSync(path.join(output, "front-end/vue/vue.txt"), "utf8"), "vue");
        assert.equal(fs.readFileSync(path.join(output, "back-end/express/express.txt"), "utf8"), "express");
        assert.equal(fs.existsSync(path.join(output, "front-end/react")), false);
        assert.equal(fs.existsSync(path.join(output, "back-end/fastapi")), false);
        assert.equal(fs.existsSync(path.join(output, "deployment/compose.yml")), true);
        assert.equal(fs.existsSync(path.join(output, "docs/guide.md")), true);
        const readme = fs.readFileSync(path.join(output, "README.md"), "utf8");
        assert.match(readme, /sample-project/);
        assert.match(readme, /front-end\/vue/);
        assert.match(readme, /back-end\/express/);
        assert.equal(fs.existsSync(path.join(output, "cdis-template.json")), false);
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
});

test("excludes sensitive and generated files while assembling", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "cdis-exclude-test-"));
    const template = path.join(root, "template");
    const output = path.join(root, "output");
    try {
        fs.mkdirSync(path.join(template, "front-end/react/node_modules/pkg"), { recursive: true });
        fs.mkdirSync(path.join(template, "back-end/express"), { recursive: true });
        fs.writeFileSync(path.join(template, "front-end/react/.env"), "secret");
        fs.writeFileSync(path.join(template, "front-end/react/node_modules/pkg/index.js"), "module");
        fs.writeFileSync(path.join(template, "front-end/react/app.js"), "app");
        fs.writeFileSync(path.join(template, "back-end/express/server.js"), "server");
        assembleTemplate(template, output, {
            components: [],
            files: { exclude: [".env", "node_modules"] }
        }, {
            frontend: { path: "front-end/react" },
            backend: { path: "back-end/express" }
        });
        assert.equal(fs.existsSync(path.join(output, "front-end/react/.env")), false);
        assert.equal(fs.existsSync(path.join(output, "front-end/react/node_modules")), false);
        assert.equal(fs.existsSync(path.join(output, "front-end/react/app.js")), true);
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
});


test("writes selected stack deployment defaults for each generated stack", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "cdis-stack-defaults-"));
    try {
        fs.mkdirSync(path.join(root, "deployment", "compose"), { recursive: true });
        const manifest = { name: "test-template", schemaVersion: "1.0" };
        writeProjectReadme(root, manifest, {
            frontend: { id: "vue", path: "front-end/vue" },
            backend: { id: "fastapi", path: "back-end/fastapi" }
        }, "vue-fastapi-app");

        const env = fs.readFileSync(path.join(root, "deployment", "compose", ".env"), "utf8");
        assert.match(env, /^FRONTEND_STACK=vue$/m);
        assert.match(env, /^BACKEND_STACK=fastapi$/m);
        assert.match(env, /^FRONTEND_BUILD_CONTEXT=..\/..\/front-end\/vue$/m);
        assert.match(env, /^BACKEND_BUILD_CONTEXT=..\/..\/back-end\/fastapi$/m);

        const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
        assert.match(readme, /compose\\.fastapi\\.yaml/);
        assert.match(readme, /deploy\\.sh <frontend-image-tag> <backend-image-tag> vue fastapi/);
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
});
