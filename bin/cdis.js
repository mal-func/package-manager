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

const args = process.argv.slice(2);
const command = args[0];

function displayTemplateInfo(manifest, version) {
    console.log("\nCDIS Template Information");
    console.log("-------------------------");

    console.log(`Version: ${version}`);
    console.log(`Name: ${manifest.name}`);
    console.log(`Description: ${manifest.description || "Not provided"}`);
    console.log(`Schema version: ${manifest.schemaVersion}`);

    console.log("\nLanguages:");
    (manifest.language || []).forEach(language => {
        console.log(`  - ${language}`);
    });

    console.log("\nComponents:");
    (manifest.components || []).forEach(component => {
        console.log(`  - ${component}`);
    });
}

switch (command) {
    case "--help":
    case "help":
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
        `);
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

                versions.forEach(version => {
                    console.log(`  ${version}`);
                });
            }
        } catch (error) {
            console.error(error.message);
            process.exitCode = 1;
        }
    } else if (subcommand === "info") {
        try {
            const versionIndex = args.indexOf("--version");

            if (
                versionIndex !== -1 &&
                (!args[versionIndex + 1] ||
                 args[versionIndex + 1].startsWith("--"))
            ) {
                throw new Error("Please provide a template version.");
            }

            const versions = await getTemplateVersions();

            if (versions.length === 0) {
                throw new Error("No template versions are available.");
            }

            const version =
                versionIndex !== -1
                    ? args[versionIndex + 1]
                    : versions[0];

            if (!versions.includes(version)) {
                throw new Error(
                    `Template version '${version}' does not exist.`
                );
            }

            const manifest = await fetchTemplateManifest(version);

            displayTemplateInfo(manifest, version);

        } catch (error) {
            console.error(error.message);
            process.exitCode = 1;
        }
    } else {
        console.log(
            "Unknown template command. Try 'cdis template versions' or 'cdis template info'."
        );
    }

    break;
    }


    case "create": {
        const projectName = args[1];

        if (!projectName) {
            console.log("Please provide a project name.");
            break;
        }

        const destination = path.resolve(process.cwd(), projectName);
        const tempZip = path.join(os.tmpdir(), "cdis-template.zip");

        if (fs.existsSync(destination)) {
            console.log("A directory with this name already exists.");
            break;
        }

        try {
            const versionIndex = args.indexOf("--version");

            if (
                versionIndex !== -1 &&
                (!args[versionIndex + 1] ||
                args[versionIndex + 1].startsWith("--"))
            ) {
                throw new Error("Please provide a template version.");
            }

            const templateVersion =
                versionIndex !== -1
                    ? args[versionIndex + 1]
                    : "v1.0.0";

            await downloadTemplate(tempZip, templateVersion);

            fs.mkdirSync(destination, { recursive: true });
            extractTemplate(tempZip, destination);

            const templateDirectory = destination;

            const manifest = readManifest(templateDirectory);

            console.log(`Template: ${manifest.name}`);
            console.log(`Schema version: ${manifest.schemaVersion}`);

            fs.rmSync(tempZip, { force: true });

            console.log(`Project '${projectName}' created successfully!`);
        } catch (error) {
            console.error("Failed to create project:", error.message);

            if (fs.existsSync(destination)) {
                fs.rmSync(destination, { recursive: true, force: true });
            }

            if (fs.existsSync(tempZip)) {
                fs.rmSync(tempZip, { force: true });
            }

            process.exitCode = 1;
        }

        break;
    }

    default:
        console.log("Unknown command. Run 'cdis help' for available commands.");
}