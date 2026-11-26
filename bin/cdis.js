#!/usr/bin/env node

import fs from "fs";
import path from "path";
import os from "os";

import { DEFAULT_TEMPLATE_BRANCH } from "../src/config.js";

import { validateManifest, readManifest } from "../src/template/manifest.js";
import { getTemplateVersions } from "../src/template/versions.js";
import { fetchTemplateSnapshot, downloadSelectedComponents } from "../src/template/component-download.js";
import { downloadTemplate } from "../src/template/download.js";
import { extractTemplate } from "../src/template/extract.js";
import { resolveTechnologySelection } from "../src/template/selection.js";
import { resolveToolingSelection, applyToolingSelection } from "../src/template/tooling.js";
import { promptForTechnologies, promptForTooling } from "../src/cli/prompts.js";
import { assembleTemplate, writeProjectReadme } from "../src/template/assemble.js";

const CLI_VERSION = "1.0.0";
const DEFAULT_TEMPLATE_REF = DEFAULT_TEMPLATE_BRANCH;
const DEFAULT_TEMPLATE_REF_TYPE = "heads";
const args = process.argv.slice(2);
const command = args[0];

function getOption(name) {
    const prefix = `${name}=`;
    const inline = args.find(argument => argument.startsWith(prefix));
    if (inline !== undefined) return inline.slice(prefix.length);

    const index = args.indexOf(name);
    if (index === -1) return undefined;
    const value = args[index + 1];
    if (!value || value.startsWith("--")) {
        throw new Error(`Please provide a value for ${name}.`);
    }
    return value;
}

function showHelp() {
    console.log(`
CDIS - Project Template Manager

Usage:
  cdis <command> [options]

Commands:
  create <project-name>       Create a project from the CDIS template
  template versions           List published template versions
  template info               Show template details and available technologies
  template options            List selectable frontend/backend options
  version                     Show the installed CLI version
  help                        Show this help message

Create options:
  --frontend <id>             Select a frontend (default comes from the manifest)
  --backend <id>              Select a backend (default comes from the manifest)
  --frontend-linter <id>      Select frontend linter when alternatives exist
  --backend-linter <id>       Select backend linter when alternatives exist
  --prettier                  Add optional Prettier formatting
  --ruff-format               Enable optional Ruff formatting for FastAPI
  --version <version>         Use a published template version
  --branch <branch>           Use a Git branch (useful for development)
  --help                      Show create command help

Template info/options options:
  --version <version>         Inspect a published template version
  --branch <branch>           Inspect a Git branch

Environment:
  CDIS_TEMPLATE_REPOSITORY    Override the template source (owner/repository)
  CDIS_TEMPLATE_BRANCH        Override the default template branch (default: main)

Examples:
  cdis create my-project
  cdis create my-project --frontend vue --backend express --backend-linter biome
  cdis create my-project --frontend react --backend fastapi --prettier --ruff-format
  cdis template versions
  cdis template info --branch main
  cdis help
  cdis version
    `);
}

function showCreateHelp() {
    console.log(`
Usage:
  cdis create <project-name> [options]

Options:
  --frontend <id>          Frontend ID declared in cdis-template.json
  --backend <id>           Backend ID declared in cdis-template.json
  --frontend-linter <id>   Choose frontend linter when multiple are supported
  --backend-linter <id>    Choose backend linter when multiple are supported
  --prettier               Add optional Prettier formatting
  --ruff-format            Enable optional Ruff formatting for FastAPI
  --no-interactive         Use manifest defaults and skip optional prompts
  --version <version>      Use a published template tag
  --branch <branch>        Git branch to use instead of a published tag
  --help                   Show this help
    `);
}

function displayTemplateInfo(manifest, ref) {
    console.log("\nCDIS Template Information");
    console.log("-------------------------");
    console.log(`Template ref: ${ref}`);
    console.log(`Name: ${manifest.name}`);
    console.log(`Description: ${manifest.description || "Not provided"}`);
    console.log(`Schema version: ${manifest.schemaVersion}`);
    console.log(`Languages: ${(manifest.language || []).join(", ") || "Not specified"}`);
    console.log(`Shared components: ${(manifest.components || []).filter(x => x !== "front-end" && x !== "back-end").join(", ") || "None"}`);
}

function displayTechnologyOptions(manifest) {
    if (!manifest.frontends || !manifest.backends) {
        console.log("This template does not declare selectable frontend/backend options.");
        return;
    }
    console.log("\nFrontends:");
    manifest.frontends.forEach(option =>
        console.log(`  ${option.id}${option.default ? " (default)" : ""} — ${option.path}`)
    );
    console.log("\nBackends:");
    manifest.backends.forEach(option =>
        console.log(`  ${option.id}${option.default ? " (default)" : ""} — ${option.path}`)
    );
    if (manifest.compatibility) {
        console.log("\nDeclared compatibility:");
        for (const [frontend, backends] of Object.entries(manifest.compatibility)) {
            console.log(`  ${frontend}: ${backends.join(", ")}`);
        }
    } else {
        console.log("\nCompatibility: not declared by this template version.");
    }
}

function resolveRefOptions() {
    const version = getOption("--version");
    const branch = getOption("--branch");
    if (version && branch) throw new Error("Use either --version or --branch, not both.");
    return branch
        ? { ref: branch, refType: "heads" }
        : version
            ? { ref: version, refType: "tags" }
            : { ref: DEFAULT_TEMPLATE_REF, refType: DEFAULT_TEMPLATE_REF_TYPE };
}

async function inspectTemplate(action) {
    const { ref, refType } = resolveRefOptions();
    const snapshot = await fetchTemplateSnapshot(ref, refType);
    const manifest = validateManifest(snapshot.manifest);
    if (action === "info") displayTemplateInfo(manifest, ref);
    displayTechnologyOptions(manifest);
}

async function createProject() {
    if (args.includes("--help")) {
        showCreateHelp();
        return;
    }
    const projectName = args[1];
    if (!projectName || projectName.startsWith("--") ||
        !/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(projectName) ||
        projectName === "." || projectName === "..") {
        throw new Error("Provide a valid project name (letters, numbers, dots, underscores and hyphens only).");
    }
    const destination = path.resolve(process.cwd(), projectName);
    if (fs.existsSync(destination)) throw new Error(`A file or directory named '${projectName}' already exists.`);

    const { ref, refType } = resolveRefOptions();
    const frontend = getOption("--frontend");
    const backend = getOption("--backend");
    const frontendLinter = getOption("--frontend-linter");
    const backendLinter = getOption("--backend-linter");
    const prettier = args.includes("--prettier");
    const ruffFormat = args.includes("--ruff-format");
    const shouldPrompt = process.stdin.isTTY && process.stdout.isTTY && !args.includes("--no-interactive");
    let stagingDirectory;

    try {
        console.log(`\nPreparing CDIS project '${projectName}'...`);
        const snapshot = await fetchTemplateSnapshot(ref, refType);
        const manifest = validateManifest(snapshot.manifest);

        if (manifest.frontends && manifest.backends) {
            const requested = shouldPrompt
                ? await promptForTechnologies(manifest, { frontend, backend })
                : { frontend, backend };
            const selection = resolveTechnologySelection(manifest, requested);
            const requestedTools = shouldPrompt
                ? await promptForTooling(manifest, selection, { frontendLinter, backendLinter, prettier, ruffFormat })
                : { frontendLinter, backendLinter, prettier, ruffFormat };
            const tooling = resolveToolingSelection(manifest, selection, requestedTools);

            console.log(`Template: ${manifest.name} (${ref}, ${snapshot.sha.slice(0, 7)})`);
            console.log(`Selected frontend: ${selection.frontend.id}`);
            console.log(`Selected backend: ${selection.backend.id}`);
            console.log(`Frontend linter: ${tooling.frontendLinter || "not applicable"}`);
            console.log(`Backend linter: ${tooling.backendLinter || "not applicable"}`);
            if (tooling.prettier) console.log("Optional formatter: Prettier");
            if (tooling.ruffFormat) console.log("Optional formatter: Ruff");

            if (!selection.compatibilityChecked) {
                console.warn("Warning: this manifest has no compatibility map; this combination has not been compatibility-validated.");
            }

            const result = await downloadSelectedComponents(
                destination, snapshot, manifest, selection,
                {
                    concurrency: 8,
                    onProgress: (completed, total) => {
                        if (completed === 1 || completed === total || completed % 25 === 0) {
                            console.log(`Downloaded ${completed}/${total} selected files`);
                        }
                    }
                }
            );
            applyToolingSelection(destination, selection, tooling);
            writeProjectReadme(destination, manifest, selection, projectName);
            console.log(`Skipped ${result.skippedFiles} files outside the selected components.`);
            if (tooling.frontendLinter === "biome" || tooling.backendLinter === "biome" || tooling.prettier) {
                console.log("Tooling dependencies changed. Run npm install in each affected JavaScript/TypeScript project before using npm scripts.");
            }
        } else {
            if (frontend || backend || frontendLinter || backendLinter || prettier || ruffFormat) {
                throw new Error("This template version does not support technology/tooling selection.");
            }
            console.log("This is a legacy template manifest; using the legacy full-template download path.");
            stagingDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "cdis-cli-"));
            const zipPath = path.join(stagingDirectory, "template.zip");
            const extracted = path.join(stagingDirectory, "template");
            await downloadTemplate(zipPath, ref, refType);
            fs.mkdirSync(extracted, { recursive: true });
            extractTemplate(zipPath, extracted);
            const extractedManifest = readManifest(extracted);
            assembleTemplate(extracted, destination, extractedManifest, undefined, projectName);
        }

        console.log(`\nProject '${projectName}' created successfully!`);
        console.log(`Next: cd ${projectName}`);
    } catch (error) {
        if (fs.existsSync(destination)) fs.rmSync(destination, { recursive: true, force: true });
        throw error;
    } finally {
        if (stagingDirectory && fs.existsSync(stagingDirectory)) {
            fs.rmSync(stagingDirectory, { recursive: true, force: true });
        }
    }
}

try {
    switch (command) {
        case "help":
        case "--help":
        case "-h":
            showHelp();
            break;
        case "version":
        case "--version":
        case "-v":
            console.log(`CDIS CLI v${CLI_VERSION}`);
            break;
        case "create":
            await createProject();
            break;
        case "template": {
            const subcommand = args[1];
            if (subcommand === "versions") {
                const versions = await getTemplateVersions();
                if (versions.length === 0) console.log("No published CDIS template versions found.");
                else {
                    console.log("Available CDIS template versions:");
                    versions.forEach(version => console.log(`  ${version}`));
                }
            } else if (subcommand === "info" || subcommand === "options") {
                await inspectTemplate(subcommand);
            } else {
                throw new Error("Unknown template command. Use 'cdis template versions', 'cdis template info' or 'cdis template options'.");
            }
            break;
        }
        default:
            showHelp();
            if (command) process.exitCode = 1;
    }
} catch (error) {
    console.error(`\nError: ${error.message}`);
    process.exitCode = 1;
}
