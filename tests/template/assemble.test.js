import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { assembleTemplate } from "../../src/template/assemble.js";

test("assembles only selected frontend/backend and shared components", () => {
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
        fs.writeFileSync(path.join(template, "deployment", "compose.yml"), "services: {}");
        fs.writeFileSync(path.join(template, "docs", "guide.md"), "guide");
        fs.writeFileSync(path.join(template, "README.md"), "readme");
        fs.writeFileSync(path.join(template, "cdis-template.json"), "{}");

        const manifest = {
            components: ["front-end", "back-end", "deployment", "docs"],
            files: { exclude: [".env", "node_modules"] }
        };
        assembleTemplate(template, output, manifest, {
            frontend: { id: "vue", path: "front-end/vue" },
            backend: { id: "express", path: "back-end/express" }
        });

        assert.equal(fs.readFileSync(path.join(output, "front-end", "vue.txt"), "utf8"), "vue");
        assert.equal(fs.readFileSync(path.join(output, "back-end", "express.txt"), "utf8"), "express");
        assert.equal(fs.existsSync(path.join(output, "front-end", "react.txt")), false);
        assert.equal(fs.existsSync(path.join(output, "back-end", "fastapi.txt")), false);
        assert.equal(fs.existsSync(path.join(output, "deployment", "compose.yml")), true);
        assert.equal(fs.existsSync(path.join(output, "docs", "guide.md")), true);
        assert.equal(fs.existsSync(path.join(output, "README.md")), true);
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
        assert.equal(fs.existsSync(path.join(output, "front-end/.env")), false);
        assert.equal(fs.existsSync(path.join(output, "front-end/node_modules")), false);
        assert.equal(fs.existsSync(path.join(output, "front-end/app.js")), true);
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
});
