import axios from "axios";
import fs from "fs";
import path from "path";

const OWNER = "mal-func";
const REPOSITORY = "cdis-template-edit";
const API_BASE = `https://api.github.com/repos/${OWNER}/${REPOSITORY}`;
const RAW_BASE = `https://raw.githubusercontent.com/${OWNER}/${REPOSITORY}`;

function validateRef(ref, refType) {
    if (!["heads", "tags"].includes(refType)) {
        throw new Error("Template ref type must be 'heads' or 'tags'.");
    }
    if (typeof ref !== "string" || !ref.trim() ||
        ref.split("/").some(part => !part || part === "." || part === "..") ||
        ref.includes("\\")) {
        throw new Error("Please provide a valid template branch or version.");
    }
}

function encodeRepoPath(repoPath) {
    return repoPath.split("/").map(encodeURIComponent).join("/");
}

export async function fetchTemplateSnapshot(ref = "main", refType = "heads") {
    validateRef(ref, refType);

    let commit;
    try {
        const commitResponse = await axios.get(
            `${API_BASE}/commits/${encodeURIComponent(ref)}`,
            { timeout: 20000 }
        );
        commit = commitResponse.data;
    } catch (error) {
        if (error.response?.status === 404) {
            throw new Error(`Template ${refType === "tags" ? "version" : "branch"} '${ref}' was not found.`);
        }
        throw new Error(`Could not resolve template ref '${ref}': ${error.message}`);
    }

    const sha = commit.sha;
    if (!sha) throw new Error(`GitHub did not return a commit SHA for '${ref}'.`);

    let treeResponse;
    try {
        treeResponse = await axios.get(`${API_BASE}/git/trees/${sha}?recursive=1`, {
            timeout: 30000
        });
    } catch (error) {
        throw new Error(`Could not read the template file tree: ${error.message}`);
    }

    if (treeResponse.data.truncated) {
        throw new Error("The template repository tree is too large for a complete component download.");
    }

    let manifestResponse;
    try {
        manifestResponse = await axios.get(
            `${RAW_BASE}/${sha}/cdis-template.json`,
            { timeout: 20000 }
        );
    } catch (error) {
        throw new Error(`Could not download cdis-template.json: ${error.message}`);
    }

    let manifest = manifestResponse.data;
    if (typeof manifest === "string") {
        try {
            manifest = JSON.parse(manifest);
        } catch (error) {
            throw new Error(`Template manifest is not valid JSON: ${error.message}`);
        }
    }

    return {
        ref,
        refType,
        sha,
        tree: treeResponse.data.tree,
        manifest
    };
}

function isExcluded(repoPath, excluded) {
    return repoPath.split("/").some(segment => excluded.includes(segment));
}

export function selectTemplateFiles(tree, manifest, selection) {
    const directoryRoots = [
        selection.frontend.path,
        selection.backend.path,
        ...(manifest.components ?? []).filter(
            component => component !== "front-end" && component !== "back-end"
        )
    ];
    const includedPaths = manifest.files?.include ?? [];

    return tree.filter(entry => {
        if (entry.type !== "blob" || entry.mode === "120000") return false;
        if (isExcluded(entry.path, manifest.files?.exclude ?? [])) return false;

        const inSelectedDirectory = directoryRoots.some(root =>
            entry.path.startsWith(`${root}/`)
        );
        const explicitlyIncluded = includedPaths.some(includePath =>
            entry.path === includePath || entry.path.startsWith(`${includePath}/`)
        );
        return inSelectedDirectory || explicitlyIncluded;
    });
}

function safeDestination(root, repoPath) {
    const destination = path.resolve(root, ...repoPath.split("/"));
    const resolvedRoot = path.resolve(root);
    if (destination !== resolvedRoot &&
        !destination.startsWith(resolvedRoot + path.sep)) {
        throw new Error(`Unsafe template path: '${repoPath}'.`);
    }
    return destination;
}

async function downloadOne(entry, snapshot, destinationRoot, request) {
    const url = `${RAW_BASE}/${snapshot.sha}/${encodeRepoPath(entry.path)}`;
    const destination = safeDestination(destinationRoot, entry.path);
    fs.mkdirSync(path.dirname(destination), { recursive: true });

    let lastError;
    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            const response = await request(url, {
                responseType: "arraybuffer",
                timeout: 30000
            });
            fs.writeFileSync(destination, response.data);
            if (entry.mode === "100755") fs.chmodSync(destination, 0o755);
            return;
        } catch (error) {
            lastError = error;
            const status = error.response?.status;
            if (attempt === 2 || (status && status < 500 && status !== 429)) break;
            await new Promise(resolve => setTimeout(resolve, 400 * (2 ** attempt)));
        }
    }
    throw new Error(`Could not download '${entry.path}': ${lastError?.message ?? "unknown error"}`);
}

export async function downloadSelectedComponents(
    destination,
    snapshot,
    manifest,
    selection,
    { concurrency = 8, onProgress = () => {}, request = axios.get } = {}
) {
    const files = selectTemplateFiles(snapshot.tree, manifest, selection);
    if (files.length === 0) {
        throw new Error("No files matched the selected frontend, backend and shared components.");
    }

    fs.mkdirSync(destination, { recursive: true });
    let nextIndex = 0;
    let completed = 0;

    const worker = async () => {
        while (true) {
            const index = nextIndex;
            nextIndex += 1;
            if (index >= files.length) return;

            await downloadOne(files[index], snapshot, destination, request);
            completed += 1;
            onProgress(completed, files.length, files[index].path);
        }
    };

    const workerCount = Math.max(1, Math.min(concurrency, files.length));
    await Promise.all(Array.from({ length: workerCount }, () => worker()));

    return {
        downloadedFiles: completed,
        skippedFiles: snapshot.tree.filter(entry => entry.type === "blob").length - files.length
    };
}
