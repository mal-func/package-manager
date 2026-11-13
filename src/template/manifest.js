import fs from "fs";
import path from "path";
import axios from "axios";

const ID_PATTERN = /^[a-z0-9][a-z0-9-]*$/;

function validateTechnologyOptions(options, label) {
    if (!Array.isArray(options) || options.length === 0) {
        throw new Error(`Manifest '${label}' must be a non-empty array.`);
    }
    const ids = new Set();
    let defaultCount = 0;
    for (const option of options) {
        if (!option || typeof option !== "object" || Array.isArray(option)) {
            throw new Error(`Every entry in '${label}' must be an object.`);
        }
        if (typeof option.id !== "string" || !ID_PATTERN.test(option.id)) {
            throw new Error(`Every '${label}' entry must have a valid lowercase id.`);
        }
        if (ids.has(option.id)) {
            throw new Error(`Duplicate technology id '${option.id}' in '${label}'.`);
        }
        ids.add(option.id);
        if (typeof option.path !== "string" || option.path.trim() === "") {
            throw new Error(`Technology '${option.id}' in '${label}' must define a path.`);
        }
        const segments = option.path.split("/");
        if (option.path.startsWith("/") || option.path.includes("\\") ||
            segments.some(segment => segment === "" || segment === "." || segment === "..")) {
            throw new Error(`Technology '${option.id}' in '${label}' has an unsafe path: '${option.path}'.`);
        }
        if (option.default === true) defaultCount += 1;
        if (option.default !== undefined && typeof option.default !== "boolean") {
            throw new Error(`The default field for '${option.id}' in '${label}' must be a boolean.`);
        }
    }
    if (defaultCount !== 1) {
        throw new Error(`Manifest '${label}' must contain exactly one default technology.`);
    }
    return ids;
}

export function validateManifest(manifest) {
    if (!manifest || typeof manifest !== "object" || Array.isArray(manifest) ||
        !manifest.name || !manifest.schemaVersion) {
        throw new Error("Invalid template manifest.");
    }
    if (manifest.components !== undefined &&
        (!Array.isArray(manifest.components) ||
         manifest.components.some(component => typeof component !== "string" || !component.trim()))) {
        throw new Error("Manifest 'components' must be an array of non-empty paths.");
    }
    const safeRelativePath = value =>
        typeof value === "string" && value.trim() !== "" &&
        !value.startsWith("/") && !value.includes("\\\\") &&
        value.split("/").every(segment => segment && segment !== "." && segment !== "..");

    if (manifest.components?.some(component => !safeRelativePath(component))) {
        throw new Error("Manifest 'components' contains an unsafe path.");
    }
    if (manifest.files !== undefined &&
        (!manifest.files || typeof manifest.files !== "object" || Array.isArray(manifest.files))) {
        throw new Error("Manifest 'files' must be an object.");
    }
    if (manifest.files?.include !== undefined &&
        (!Array.isArray(manifest.files.include) ||
         manifest.files.include.some(item => !safeRelativePath(item)))) {
        throw new Error("Manifest 'files.include' must be an array of safe relative paths.");
    }
    if (manifest.files?.exclude !== undefined &&
        (!Array.isArray(manifest.files.exclude) ||
         manifest.files.exclude.some(item => typeof item !== "string" || !item.trim() || item.includes("/") || item.includes("\\\\")))) {
        throw new Error("Manifest 'files.exclude' must be an array of path names.");
    }

    const hasFrontends = manifest.frontends !== undefined;
    const hasBackends = manifest.backends !== undefined;
    if (hasFrontends !== hasBackends) {
        throw new Error("Manifest must define both 'frontends' and 'backends' when technology selection is enabled.");
    }

    if (hasFrontends) {
        const frontendIds = validateTechnologyOptions(manifest.frontends, "frontends");
        const backendIds = validateTechnologyOptions(manifest.backends, "backends");

        if (manifest.compatibility !== undefined) {
            const compatibility = manifest.compatibility;
            if (!compatibility || typeof compatibility !== "object" || Array.isArray(compatibility)) {
                throw new Error("Manifest 'compatibility' must be an object.");
            }
            for (const frontendId of frontendIds) {
                const allowedBackends = compatibility[frontendId];
                if (!Array.isArray(allowedBackends) || allowedBackends.length === 0) {
                    throw new Error(`Compatibility for frontend '${frontendId}' must be a non-empty array of backend ids.`);
                }
                const seen = new Set();
                for (const backendId of allowedBackends) {
                    if (typeof backendId !== "string" || !backendIds.has(backendId)) {
                        throw new Error(`Compatibility for frontend '${frontendId}' references unknown backend '${backendId}'.`);
                    }
                    if (seen.has(backendId)) {
                        throw new Error(`Compatibility for frontend '${frontendId}' contains duplicate backend '${backendId}'.`);
                    }
                    seen.add(backendId);
                }
            }
            for (const frontendId of Object.keys(compatibility)) {
                if (!frontendIds.has(frontendId)) {
                    throw new Error(`Compatibility references unknown frontend '${frontendId}'.`);
                }
            }
        }
    }
    return manifest;
}

export function readManifest(templateDirectory) {
    const manifestPath = path.join(templateDirectory, "cdis-template.json");
    if (!fs.existsSync(manifestPath)) throw new Error("Template manifest not found.");

    let manifest;
    try {
        manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    } catch (error) {
        throw new Error(`Could not parse template manifest: ${error.message}`);
    }
    return validateManifest(manifest);
}

export async function fetchTemplateManifest(version) {
    const manifestUrl =
        `https://raw.githubusercontent.com/mal-func/cdis-template-edit/${version}/cdis-template.json`;
    try {
        const response = await axios.get(manifestUrl);
        return validateManifest(response.data);
    } catch (error) {
        if (error.response?.status === 404) {
            throw new Error(`Manifest not found for template version '${version}'.`);
        }
        if (/^(Invalid template manifest|Manifest |Every |Duplicate |Technology |Compatibility )/.test(error.message)) {
            throw error;
        }
        throw new Error(`Could not retrieve template manifest: ${error.message}`);
    }
}
