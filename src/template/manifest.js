import fs from "fs";
import path from "path";
import axios from "axios";

export function readManifest(templateDirectory) {
    const manifestPath = path.join(
        templateDirectory,
        "cdis-template.json"
    );

    if (!fs.existsSync(manifestPath)) {
        throw new Error("Template manifest not found.");
    }

    const manifest = JSON.parse(
        fs.readFileSync(manifestPath, "utf-8")
    );

    if (!manifest.name || !manifest.schemaVersion) {
        throw new Error("Invalid template manifest.");
    }

    return manifest;
}

export async function fetchTemplateManifest(version) {
    const manifestUrl =
        `https://raw.githubusercontent.com/mal-func/cdis-template-edit/${version}/cdis-template.json`;

    try {
        const response = await axios.get(manifestUrl);
        const manifest = response.data;

        if (!manifest.name || !manifest.schemaVersion) {
            throw new Error("Invalid template manifest.");
        }

        return manifest;
    } catch (error) {
        if (error.response?.status === 404) {
            throw new Error(
                `Manifest not found for template version '${version}'.`
            );
        }

        throw new Error(
            `Could not retrieve template manifest: ${error.message}`
        );
    }
}