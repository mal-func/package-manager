import test from "node:test";
import assert from "node:assert/strict";
import fs from "fs";
import os from "os";
import path from "path";
import AdmZip from "adm-zip";
import { extractTemplate } from "../../src/template/extract.js";

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

test("rejects archive entries that escape the destination", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "cdis-zip-slip-test-"));
    try {
        const archivePath = path.join(root, "malicious.zip");
        const destination = path.join(root, "output");
        const zip = new AdmZip();
        zip.addFile("template-main/../../outside.txt", Buffer.from("bad"));
        zip.writeZip(archivePath);
        fs.mkdirSync(destination);
        assert.throws(() => extractTemplate(archivePath, destination), /Unsafe path/);
        assert.equal(fs.existsSync(path.join(root, "outside.txt")), false);
    } finally {
        fs.rmSync(root, { recursive: true, force: true });
    }
});
