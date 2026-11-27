import test from "node:test";
import assert from "node:assert/strict";
import {
    resolveTemplateBranch,
    resolveTemplateRepository
} from "../../src/config.js";

test("uses the canonical template repository when no override is supplied", () => {
    assert.equal(resolveTemplateRepository(undefined), "mal-func/cdis-template-edit");
    assert.equal(resolveTemplateRepository(""), "mal-func/cdis-template-edit");
});

test("accepts a repository override in owner/repository format", () => {
    assert.equal(resolveTemplateRepository("my-org/my-template"), "my-org/my-template");
    assert.equal(resolveTemplateRepository(" my-org/my-template "), "my-org/my-template");
});

test("rejects malformed repository overrides", () => {
    for (const value of ["my-template", "/my-template", "my-org/", "my-org/my-template/extra", "https://github.com/my-org/my-template"]) {
        assert.throws(() => resolveTemplateRepository(value), /owner\/repository format/);
    }
});

test("uses main as the default branch and accepts an override", () => {
    assert.equal(resolveTemplateBranch(undefined), "main");
    assert.equal(resolveTemplateBranch(""), "main");
    assert.equal(resolveTemplateBranch("develop"), "develop");
    assert.equal(resolveTemplateBranch(" feature/tooling "), "feature/tooling");
});
