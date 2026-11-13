import fs from "fs";
import path from "path";

function isExcluded(relativePath, excluded) {
    const segments = relativePath.split(path.sep);
    return excluded.some(item => segments.includes(item));
}

function copyDirectory(sourceRoot, relativeSource, destination, excluded) {
    const source = path.resolve(sourceRoot, relativeSource);
    const root = path.resolve(sourceRoot);
    if (source !== root && !source.startsWith(root + path.sep)) {
        throw new Error(`Component path escapes the template root: '${relativeSource}'.`);
    }
    if (!fs.existsSync(source) || !fs.statSync(source).isDirectory()) {
        throw new Error(`Template component directory not found: '${relativeSource}'.`);
    }

    fs.cpSync(source, destination, {
        recursive: true,
        filter: currentPath => {
            const relative = path.relative(source, currentPath);
            return relative === "" || !isExcluded(relative, excluded);
        }
    });
}

export function writeProjectReadme(destination, manifest, selection, projectName) {
    const frontendReadme = `${selection.frontend.path}/README.md`;
    const backendReadme = `${selection.backend.path}/README.md`;
    const lines = [
        `# ${projectName || "CDIS project"}`,
        "",
        "Generated with the CDIS project manager.",
        "",
        "## Selected stack",
        `- Frontend: **${selection.frontend.id}** — ${selection.frontend.path}/`,
        `- Backend: **${selection.backend.id}** — ${selection.backend.path}/`,
        "",
        "## Getting started",
        `- Frontend guide: [${frontendReadme}](${frontendReadme})`,
        `- Backend guide: [${backendReadme}](${backendReadme})`,
        "- Deployment guide: [deployment/README.md](deployment/README.md)",
        "- Project documentation: [docs/](docs/)",
        "",
        `Generated from ${manifest.name} (schema ${manifest.schemaVersion}).`,
        ""
    ];
    fs.writeFileSync(path.join(destination, "README.md"), lines.join("\n"));
}

export function assembleTemplate(templateDirectory, destination, manifest, selection, projectName) {
    const excluded = manifest.files?.exclude ?? [];
    fs.mkdirSync(destination, { recursive: true });

    if (!selection) {
        // Backwards-compatible behavior for older templates without technology options.
        fs.cpSync(templateDirectory, destination, {
            recursive: true,
            filter: currentPath => {
                const relative = path.relative(templateDirectory, currentPath);
                if (relative === "") return true;
                return !isExcluded(relative, excluded);
            }
        });
        return;
    }

    // Keep manifest paths in the generated project because deployment configs
    // use these paths as their default Docker build contexts.
    copyDirectory(templateDirectory, selection.frontend.path,
        path.join(destination, selection.frontend.path), excluded);
    copyDirectory(templateDirectory, selection.backend.path,
        path.join(destination, selection.backend.path), excluded);

    for (const component of manifest.components ?? []) {
        if (component === "front-end" || component === "back-end") continue;
        const source = path.join(templateDirectory, component);
        if (!fs.existsSync(source)) {
            throw new Error(`Declared shared component directory not found: '${component}'.`);
        }
        copyDirectory(templateDirectory, component, path.join(destination, component), excluded);
    }

    writeProjectReadme(destination, manifest, selection, projectName);
}
