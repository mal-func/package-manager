#!/usr/bin/env node

import fs from "fs";
import path from "path";
import os from "os";

import {
    readManifest,
    fetchTemplateManifest
} from "../src/template/manifest.js";
import { getTemplateVersions } from "../src/template/versions.js";
import { downloadTemplate } from "../src/template/download.js";
import { extractTemplate } from "../src/template/extract.js";
import { resolveTechnologySelection } from "../src/template/selection.js";
import { assembleTemplate } from "../src/template/assemble.js";

const args = process.argv.slice(2);
const command = args[0];

function getOption(name) {
    const prefix = `${name}=`;
    const inline = args.find(argument => argument.startsWith(prefix));
    if (inline) return inline.slice(prefix.length);

    const index = args.indexOf(name);
    if (index === -1) return undefined;
    const value = args[index + 1];
    if (!value || value.startsWith("--")) {
        throw new Error(`Please provide a value for ${name}.`);
    }
    return value;
}

function hasOption(name) {
    return args.some(argument => argument === name || argument.startsWith(`${name}=`));
}

function displayTemplateInfo(manifest, version) {
    console.log("\nCDIS Template Information");
    console.log("-------------------------");
    console.log(`Version/ref: ${version}`);
    console.log(`Name: ${manifest.name}`);
    console.log(`Description: ${manifest.description || "Not provided"}`);
    console.log(`Schema version: ${manifest.schemaVersion}`);

    console.log("\nLanguages:");
    (manifest.language || []).forEach(language => console.log(`  - ${language}`));

    console.log("\nComponents:");
    (manifest.components || []).forEach(component => console.log(`  - ${component}`));

    if (manifest.frontends) {
        console.log("\nFrontend options:");
        manifest.frontends.forEach(option =>
            console.log(`  - ${option.id}${option.default ? " (default)" : ""} -> ${option.path}`)
        );
    }
    if (manifest.backends) {
        console.log("\nBackend options:");
        manifest.backends.forEach(option =>
            console.log(`  - ${option.id}${option.default ? " (default)" : ""} -> ${option.path}`)
        );
    }
}

function showHelp() {
    console.log(`
CDIS - Project Template Manager

Usage:
  cdis <command> [options]
  cdis template info [--version <version>]

Commands:
  create <project-name>    Create a new project
  version                  Display CLI version
  template versions        List available template versions
  template info            Display template information
  help                     Display help information

Create options:
  --frontend <id>          Select frontend (defaults to manifest default)
  --backend <id>           Select backend (defaults to manifest default)
  --version <version>      Download a tagged template version
  --branch <branch>        Download a template branch (useful for development)

Examples:
  cdis create my-project
  cdis create my-project --frontend vue --backend express
  cdis create my-project --frontend react --backend fastapi --branch feat/vue-frontend-parity
    `);
}

switch (command) {
    case "--help":
    case "help":
        showHelp();
        break;

    case "version":
        console.log("CDIS CLI v1.0.0");
        break;

    case "template": {
        const subcommand = args[1];
        if (subcommand === "versions") {
            try {
                const versions = await getTemplateVersions();
                if (versions.length === 0) {
                    console.log("No template versions found.");
                } else {
                    console.log("Available CDIS template versions:");
                    versions.forEach(version => console.log(`  ${version}`));
                }
            } catch (error) {
                console.error(error.message);
                process.exitCode = 1;
            }
        } else if (subcommand === "info") {
            try {
                const version = getOption("--version") ?? "v1.0.0";
                const manifest = await fetchTemplateManifest(version);
                displayTemplateInfo(manifest, version);
            } catch (error) {
                console.error(error.message);
                process.exitCode = 1;
            }
        } else {
            console.log("Unknown template command. Try 'cdis template versions' or 'cdis template info'.");
            process.exitCode = 1;
        }
        break;
    }

    case "create": {
        const projectName = args[1];
        if (!projectName || projectName.startsWith("--")) {
            console.error("Please provide a project name.");
            process.exitCode = 1;
            break;
        }

        const destination = path.resolve(process.cwd(), projectName);
        if (fs.existsSync(destination)) {
            console.error("A directory with this name already exists.");
            process.exitCode = 1;
            break;
        }

        let stagingDirectory;
        try {
            const version = getOption("--version");
            const branch = getOption("--branch");
            const frontend = getOption("--frontend");
            const backend = getOption("--backend");

            if (version && branch) {
                throw new Error("Use either --version or --branch, not both.");
            }

            const templateRef = branch ?? version ?? "v1.0.0";
            const refType = branch ? "heads" : "tags";

            stagingDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "cdis-cli-"));
            const tempZip = path.join(stagingDirectory, "template.zip");
            const templateDirectory = path.join(stagingDirectory, "template");

            await downloadTemplate(tempZip, templateRef, refType);
            fs.mkdirSync(templateDirectory, { recursive: true });
            extractTemplate(tempZip, templateDirectory);

            const manifest = readManifest(templateDirectory);
            let selection;

            if (manifest.frontends && manifest.backends) {
                selection = resolveTechnologySelection(manifest, { frontend, backend });
                console.log(`Frontend: ${selection.frontend.id}`);
                console.log(`Backend: ${selection.backend.id}`);
                if (!selection.compatibilityChecked) {
                    console.warn("Warning: this template does not declare compatibility rules; the selected combination was not compatibility-validated.");
                }
            } else if (frontend || backend) {
                throw new Error("The selected template version does not support frontend/backend selection.");
            }

            assembleTemplate(templateDirectory, destination, manifest, selection, projectName);

            console.log(`Template: ${manifest.name}`);
            console.log(`Schema version: ${manifest.schemaVersion}`);
            console.log(`Project '${projectName}' created successfully!`);
        } catch (error) {
            console.error("Failed to create project:", error.message);
            if (fs.existsSync(destination)) {
                fs.rmSync(destination, { recursive: true, force: true });
            }
            process.exitCode = 1;
        } finally {
            if (stagingDirectory && fs.existsSync(stagingDirectory)) {
                fs.rmSync(stagingDirectory, { recursive: true, force: true });
            }
        }
        break;
    }

    default:
        console.log("Unknown command. Run 'cdis help' for available commands.");
        process.exitCode = 1;
}
