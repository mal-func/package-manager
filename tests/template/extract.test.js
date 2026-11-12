import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import AdmZip from "adm-zip";
import { extractTemplate, resolveArchiveEntryPath } from "../../src/template/extract.js";

test("extracts files from a GitHub-style archive wrapper directory", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "cdis-extract-test-"));
    try {
        const archivePath = path.join(root, "template.zip");
        const destination = path.join(root, "output");
        const zip = new AdmZip();
        zip.addFile("template-main/front-end/index.html", Buffer.from("hello"));
        zip.writeZip(archivePath);
        fs.mkdirSync(destination);
        extractTemplate(archivePath, destination);
        assert.equal(fs.readFileSync(path.join(destination, "front-end/index.html"), "utf8"), "hello");
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
});

test("rejects parent-directory traversal in archive entry names", () => {
    assert.throws(
        () => resolveArchiveEntryPath(
            "template-main/../../outside.txt",
            "template-main",
            path.resolve("/tmp/cdis-output")
        ),
        /Unsafe path/
    );
});

test("rejects entries outside the GitHub archive wrapper directory", () => {
    assert.throws(
        () => resolveArchiveEntryPath(
            "other-root/file.txt",
            "template-main",
            path.resolve("/tmp/cdis-output")
        ),
        /Unexpected path/
    );
});
