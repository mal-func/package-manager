import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const cliPath = fileURLToPath(new URL("../../bin/cdis.js", import.meta.url));

test("cdis create generates a real project using component-level downloads", {
    skip: process.env.CDIS_FULL_LIVE_TESTS !== "1",
    timeout: 240000
}, () => {
    const workingDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "cdis-full-create-"));
    const projectDirectory = path.join(workingDirectory, "generated-app");

    try {
        const result = spawnSync(
            process.execPath,
            [cliPath, "create", "generated-app"],
            {
                cwd: workingDirectory,
                encoding: "utf8",
                timeout: 210000,
                maxBuffer: 10 * 1024 * 1024
            }
        );

        assert.equal(result.status, 0, `CLI failed:\n${result.stdout}\n${result.stderr}`);
        assert.match(result.stdout, /Project 'generated-app' created successfully/);

        assert.equal(fs.existsSync(path.join(projectDirectory, "front-end/react/package.json")), true);
        assert.equal(fs.existsSync(path.join(projectDirectory, "back-end/express/package.json")), true);
        assert.equal(fs.existsSync(path.join(projectDirectory, "deployment/compose/compose.yaml")), true);
        assert.equal(fs.existsSync(path.join(projectDirectory, "docs/START-HERE.md")), true);
        assert.equal(fs.existsSync(path.join(projectDirectory, "front-end/vue")), false);
        assert.equal(fs.existsSync(path.join(projectDirectory, "back-end/fastapi")), false);
        assert.match(
            fs.readFileSync(path.join(projectDirectory, "README.md"), "utf8"),
            /Frontend: \*\*react\*\*/
        );

        const deployScript = path.join(projectDirectory, "deployment/scripts/deploy.sh");
        assert.equal(fs.existsSync(deployScript), true);
        assert.notEqual(fs.statSync(deployScript).mode & 0o111, 0);
    } finally {
        fs.rmSync(workingDirectory, { recursive: true, force: true });
    }
});
