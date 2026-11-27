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
        fs.mkdirSync(path.join(template, "deployment", "env"), { recursive: true });
        fs.writeFileSync(path.join(template, "deployment", "env", "production.env.example"), "PUBLIC_ORIGIN=http://localhost\n");
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

test("writes selected stack deployment defaults for all four combinations", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "cdis-stack-defaults-"));
    try {
        fs.mkdirSync(path.join(root, "deployment", "compose"), { recursive: true });
        fs.mkdirSync(path.join(root, "deployment", "env"), { recursive: true });
        fs.writeFileSync(path.join(root, "deployment", "env", "production.env.example"), "PUBLIC_ORIGIN=http://localhost\n");
        const manifest = { name: "test-template", schemaVersion: "1.0" };
        const combinations = [
            ["react", "express"],
            ["vue", "express"],
            ["react", "fastapi"],
            ["vue", "fastapi"]
        ];

        for (const [frontend, backend] of combinations) {
            writeProjectReadme(root, manifest, {
                frontend: { id: frontend, path: "front-end/" + frontend },
                backend: { id: backend, path: "back-end/" + backend }
            }, frontend + "-" + backend + "-app");

            const env = fs.readFileSync(path.join(root, "deployment", "compose", ".env"), "utf8");
            assert.match(env, new RegExp("^FRONTEND_STACK=" + frontend + "$", "m"));
            assert.match(env, new RegExp("^BACKEND_STACK=" + backend + "$", "m"));
            assert.match(env, new RegExp("^FRONTEND_BUILD_CONTEXT=../../front-end/" + frontend + "$", "m"));
            assert.match(env, new RegExp("^BACKEND_BUILD_CONTEXT=../../back-end/" + backend + "$", "m"));

            const readme = fs.readFileSync(path.join(root, "README.md"), "utf8");
            assert.ok(readme.includes("deploy.sh <frontend-image-tag> <backend-image-tag>"));
            assert.ok(readme.includes("./scripts/e2e-up.sh") || readme.includes("CDIS_BACKEND=fastapi ./scripts/e2e-up.sh"));
            assert.match(readme, /waits for the backend \/health endpoint/);
            assert.match(readme, /migration and seed job/);
            assert.match(readme, /DB_ROOT_PASSWORD/);
            assert.equal(readme.includes("compose/compose.fastapi.yaml"), backend === "fastapi");

            const productionEnv = fs.readFileSync(path.join(root, "deployment", "env", "production.env.example"), "utf8");
            assert.match(productionEnv, new RegExp("^FRONTEND_STACK=" + frontend + "$", "m"));
            assert.match(productionEnv, new RegExp("^BACKEND_STACK=" + backend + "$", "m"));
        }
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
});
