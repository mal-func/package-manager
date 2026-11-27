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
        throw new Error("Component path escapes the template root: '" + relativeSource + "'.");
    }
    if (!fs.existsSync(source) || !fs.statSync(source).isDirectory()) {
        throw new Error("Template component directory not found: '" + relativeSource + "'.");
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
    const frontendReadme = selection.frontend.path + "/README.md";
    const backendReadme = selection.backend.path + "/README.md";
    const frontend = selection.frontend.id;
    const backend = selection.backend.id;
    const composeDirectory = path.join(destination, "deployment", "compose");

    if (fs.existsSync(composeDirectory)) {
        const stackEnvironment = [
            "FRONTEND_STACK=" + frontend,
            "BACKEND_STACK=" + backend,
            "FRONTEND_BUILD_CONTEXT=../../" + selection.frontend.path,
            "BACKEND_BUILD_CONTEXT=../../" + selection.backend.path,
            ""
        ].join("\n");
        fs.writeFileSync(path.join(composeDirectory, ".env"), stackEnvironment);
    }

    // Carry selected stack defaults into production config without adding secrets.
    const productionEnvExample = path.join(destination, "deployment", "env", "production.env.example");
    if (fs.existsSync(productionEnvExample)) {
        const lines = fs.readFileSync(productionEnvExample, "utf8").split(/\r?\n/);
        for (const [key, value] of [["FRONTEND_STACK", frontend], ["BACKEND_STACK", backend]]) {
            const index = lines.findIndex(line => line.startsWith(key + "="));
            if (index >= 0) lines[index] = key + "=" + value;
            else lines.push(key + "=" + value);
        }
        fs.writeFileSync(productionEnvExample, lines.join("\n").replace(/\n*$/, "") + "\n");
    }

    const startupCommand = backend === "fastapi"
        ? "CDIS_BACKEND=fastapi ./scripts/e2e-up.sh"
        : "./scripts/e2e-up.sh";
    const composeFiles = backend === "fastapi"
        ? "-f compose/compose.yaml -f compose/compose.fastapi.yaml"
        : "-f compose/compose.yaml";
    const lines = [
        "# " + (projectName || "CDIS project"),
        "",
        "Generated with the CDIS project manager.",
        "",
        "## Selected stack",
        "- Frontend: **" + frontend + "** — " + selection.frontend.path + "/",
        "- Backend: **" + backend + "** — " + selection.backend.path + "/",
        "",
        "## Getting started",
        "- Frontend guide: [" + frontendReadme + "](" + frontendReadme + ")",
        "- Backend guide: [" + backendReadme + "](" + backendReadme + ")",
        "- Deployment guide: [deployment/README.md](deployment/README.md)",
        "- Project documentation: [docs/](docs/)",
        "",
        "## Local Docker startup",
        "The CLI creates deployment/compose/.env with the selected stack and build contexts. Keep those lines when adding the local secrets below.",
        "",
        "1. Open deployment/compose/.env and add the required local values from deployment/env/production.env.example: PUBLIC_ORIGIN, DB_PASSWORD, DB_ROOT_PASSWORD, and JWT_ACCESS_SECRET. Do not replace the existing FRONTEND_BUILD_CONTEXT or BACKEND_BUILD_CONTEXT lines.",
        "2. From the deployment/ directory, run the startup script for the selected backend:",
        "",
        "```bash",
        "cd deployment",
        startupCommand,
        "```",
        "",
        "The script builds and starts the selected stack, waits for the backend /health endpoint, then runs the database migration and seed job. Open http://localhost:8080 when it finishes.",
        "",
        "On Windows, run these commands in WSL or Git Bash with Docker Desktop WSL integration enabled. The script requires Bash and curl.",
        "",
        "To stop the stack, run docker compose " + composeFiles + " down from deployment/.",
        "",
        "## Optional formatting",
        "If you selected Prettier, install JavaScript dependencies in each affected project and run npm run format once to format the generated source. The format:check script can then verify formatting in CI.",
        "",
        "## Production deployment",
        "For production, copy `deployment/env/production.env.example` to `deployment/compose/.env.production` and fill in real secrets and image names. Selected stack defaults are recorded; optional third and fourth deploy.sh arguments override them:",
        "",
        "```bash",
        "cd deployment && ./scripts/deploy.sh <frontend-image-tag> <backend-image-tag>",
        "```",
        "",
        "Generated from " + manifest.name + " (schema " + manifest.schemaVersion + ").",
        ""
    ];
    fs.writeFileSync(path.join(destination, "README.md"), lines.join("\n"));
}

export function assembleTemplate(templateDirectory, destination, manifest, selection, projectName) {
    const excluded = manifest.files?.exclude ?? [];
    fs.mkdirSync(destination, { recursive: true });
    if (!selection) {
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
        path.join(destination, selection.frontend.path), excluded);
    copyDirectory(templateDirectory, selection.backend.path,
        path.join(destination, selection.backend.path), excluded);

    for (const component of manifest.components ?? []) {
        if (component === "front-end" || component === "back-end") continue;
        const source = path.join(templateDirectory, component);
        if (!fs.existsSync(source)) {
            throw new Error("Declared shared component directory not found: '" + component + "'.");
        }
        copyDirectory(templateDirectory, component, path.join(destination, component), excluded);
    }
    writeProjectReadme(destination, manifest, selection, projectName);
}
