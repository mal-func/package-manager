import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";

function runCli(...args) {
    return spawnSync(process.execPath, ["bin/cdis.js", ...args], {
        encoding: "utf8"
    });
}

test("cdis help and cdis --help show the command list", () => {
    for (const args of [["help"], ["--help"]]) {
        const result = runCli(...args);
        assert.equal(result.status, 0);
        assert.match(result.stdout, /create <project-name>/);
        assert.match(result.stdout, /template versions/);
        assert.match(result.stdout, /template options/);
    }
});

test("cdis version prints the CLI version", () => {
    const result = runCli("version");
    assert.equal(result.status, 0);
    assert.match(result.stdout, /CDIS CLI v/);
});

test("cdis create --help shows create options without downloading a template", () => {
    const result = runCli("create", "--help");
    assert.equal(result.status, 0);
    assert.match(result.stdout, /--frontend <id>/);
    assert.match(result.stdout, /--backend <id>/);
    assert.match(result.stdout, /--version <version>/);
    assert.match(result.stdout, /--branch <branch>/);
});
