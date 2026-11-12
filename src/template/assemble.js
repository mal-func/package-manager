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

export function assembleTemplate(templateDirectory, destination, manifest, selection) {
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

    copyDirectory(templateDirectory, selection.frontend.path,
        path.join(destination, "front-end"), excluded);
    copyDirectory(templateDirectory, selection.backend.path,
        path.join(destination, "back-end"), excluded);

    for (const component of manifest.components ?? []) {
        if (component === "front-end" || component === "back-end") continue;
        const source = path.join(templateDirectory, component);
        if (!fs.existsSync(source)) {
            throw new Error(`Declared shared component directory not found: '${component}'.`);
        }
        copyDirectory(templateDirectory, component, path.join(destination, component), excluded);
    }

    const readme = path.join(templateDirectory, "README.md");
    if (fs.existsSync(readme)) {
        fs.copyFileSync(readme, path.join(destination, "README.md"));
    }
}
