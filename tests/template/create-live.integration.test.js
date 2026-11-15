import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const cliPath = fileURLToPath(new URL("../../bin/cdis.js", import.meta.url));

const supportedStacks = [
    { frontend: "react", backend: "express" },
    { frontend: "react", backend: "fastapi" },
    { frontend: "vue", backend: "express" },
    { frontend: "vue", backend: "fastapi" }
];

test("cdis create generates projects for all four supported frontend/backend combinations", {
    skip: process.env.CDIS_FULL_LIVE_TESTS !== "1",
    timeout: 900000
}, () => {
    for (const { frontend, backend } of supportedStacks) {
        const projectName = `generated-${frontend}-${backend}`;
        const workingDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "cdis-full-create-"));
        const projectDirectory = path.join(workingDirectory, projectName);

        try {
            const result = spawnSync(
                process.execPath,
                [
                    cliPath,
                    "create",
                    projectName,
                    "--frontend",
                    frontend,
                    "--backend",
                    backend
                ],
                {
                    cwd: workingDirectory,
                    encoding: "utf8",
                    timeout: 240000,
                    maxBuffer: 10 * 1024 * 1024
                }
            );

            assert.equal(
                result.status,
                0,
                `CLI failed for ${frontend} + ${backend}:\n${result.stdout}\n${result.stderr}`
            );
            assert.match(
                result.stdout,
                new RegExp(`Project '${projectName}' created successfully`)
            );

            assert.equal(
                fs.existsSync(path.join(projectDirectory, `front-end/${frontend}/package.json`)),
                true,
                `selected frontend ${frontend} should be generated`
            );
            assert.equal(
                fs.existsSync(path.join(projectDirectory, `back-end/${backend}`)),
                true,
                `selected backend ${backend} should be generated`
            );

            const otherFrontend = frontend === "react" ? "vue" : "react";
            const otherBackend = backend === "express" ? "fastapi" : "express";
            assert.equal(
                fs.existsSync(path.join(projectDirectory, `front-end/${otherFrontend}`)),
                false,
                `unselected frontend ${otherFrontend} must not be generated`
            );
            assert.equal(
                fs.existsSync(path.join(projectDirectory, `back-end/${otherBackend}`)),
                false,
                `unselected backend ${otherBackend} must not be generated`
            );

            assert.equal(fs.existsSync(path.join(projectDirectory, "deployment/compose/compose.yaml")), true);
            assert.equal(fs.existsSync(path.join(projectDirectory, "docs/START-HERE.md")), true);
            assert.equal(fs.existsSync(path.join(projectDirectory, ".gitignore")), true);

            const generatedReadme = fs.readFileSync(path.join(projectDirectory, "README.md"), "utf8");
            assert.match(generatedReadme, new RegExp(`Frontend: \\*\\*${frontend}\\*\\*`));
            assert.match(generatedReadme, new RegExp(`Backend: \\*\\*${backend}\\*\\*`));

            const deployScript = path.join(projectDirectory, "deployment/scripts/deploy.sh");
            assert.equal(fs.existsSync(deployScript), true);
            assert.notEqual(
                fs.statSync(deployScript).mode & 0o111,
                0,
                "generated deployment script should retain executable permissions"
            );
        } finally {
            fs.rmSync(workingDirectory, { recursive: true, force: true });
        }
    }
});
