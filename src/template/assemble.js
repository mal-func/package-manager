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
    const frontend = selection.frontend.id;
    const backend = selection.backend.id;
    const composeDirectory = path.join(destination, "deployment", "compose");
    if (fs.existsSync(composeDirectory)) {
        const frontendContext = `../../${selection.frontend.path}`;
        const backendContext = `../../${selection.backend.path}`;
        const stackEnvironment = [
            `FRONTEND_STACK=${frontend}`,
            `BACKEND_STACK=${backend}`,
            `FRONTEND_BUILD_CONTEXT=${frontendContext}`,
            `BACKEND_BUILD_CONTEXT=${backendContext}`,
            ""
        ].join("\n");
        fs.writeFileSync(path.join(composeDirectory, ".env"), stackEnvironment);
    }

    // Make the production deployment script default to the stack selected by
    // the CLI. Values are written into the example only; real secrets remain
    // the developer's responsibility.
    const productionEnvExample = path.join(destination, "deployment", "env", "production.env.example");
    if (fs.existsSync(productionEnvExample)) {
        let envExample = fs.readFileSync(productionEnvExample, "utf8");
        for (const [key, value] of [["FRONTEND_STACK", frontend], ["BACKEND_STACK", backend]]) {
            const assignment = new RegExp(`^${key}=.*import fs from "fs";
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
    const frontend = selection.frontend.id;
    const backend = selection.backend.id;
    const composeDirectory = path.join(destination, "deployment", "compose");
    if (fs.existsSync(composeDirectory)) {
        const frontendContext = `../../${selection.frontend.path}`;
        const backendContext = `../../${selection.backend.path}`;
        const stackEnvironment = [
            `FRONTEND_STACK=${frontend}`,
            `BACKEND_STACK=${backend}`,
            `FRONTEND_BUILD_CONTEXT=${frontendContext}`,
            `BACKEND_BUILD_CONTEXT=${backendContext}`,
            ""
        ].join("\n");
, "m");
            if (assignment.test(envExample)) {
                envExample = envExample.replace(assignment, `${key}=${value}`);
            } else {
                envExample = envExample.trimEnd() + `\\n\\n# Selected by the CDIS CLI; change if you deploy a different stack.\\n${key}=${value}\\n`;
            }
        }
        fs.writeFileSync(productionEnvExample, envExample);
    }

    const composeFiles = backend === "fastapi"
        ? "-f compose/compose.yaml -f compose/compose.fastapi.yaml"
        : "-f compose/compose.yaml";
    const lines = [
        `# ${projectName || "CDIS project"}`,
        "",
        "Generated with the CDIS project manager.",
        "",
        "## Selected stack",
        `- Frontend: **${frontend}** — ${selection.frontend.path}/`,
        `- Backend: **${backend}** — ${selection.backend.path}/`,
        "",
        "## Getting started",
        `- Frontend guide: [${frontendReadme}](${frontendReadme})`,
        `- Backend guide: [${backendReadme}](${backendReadme})`,
        "- Deployment guide: [deployment/README.md](deployment/README.md)",
        "- Project documentation: [docs/](docs/)",
        "",
        "## Deployment defaults for this generated stack",
        "The CLI has created `deployment/compose/.env` with the selected stack and local Docker build contexts. Pass it explicitly with `--env-file compose/.env` when running Compose from the deployment directory.",
        "",
        "From the project root, start the local stack with:",
        "",
        "```bash",
        `cd deployment && docker compose --env-file compose/.env ${composeFiles} up -d --build`,
        "```",
        "",
        "For production, copy `deployment/env/production.env.example` to `deployment/compose/.env.production` and fill in the real secrets and image names. The selected frontend/backend are already recorded as deployment defaults; you can override them with the optional third and fourth deploy.sh arguments:",
        "",
        "```bash",
        "cd deployment && ./scripts/deploy.sh <frontend-image-tag> <backend-image-tag>",
        "```",
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
