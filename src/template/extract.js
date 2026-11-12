import AdmZip from "adm-zip";
import fs from "fs";
import path from "path";

export function resolveArchiveEntryPath(entryName, rootDirectory, destinationRoot) {
    const archivePath = entryName.replace(/\\/g, "/");
    if (archivePath.startsWith("/") ||
        archivePath.split("/").some(segment => segment === "..")) {
        throw new Error(`Unsafe path in template archive: '${entryName}'.`);
    }

    if (archivePath === `${rootDirectory}/`) return null;
    if (!archivePath.startsWith(`${rootDirectory}/`)) {
        throw new Error(`Unexpected path in template archive: '${entryName}'.`);
    }

    const relativePath = archivePath.substring(rootDirectory.length + 1);
    if (!relativePath) return null;
    const segments = relativePath.split("/");
    if (segments.some(segment => segment === "" || segment === "." || segment === "..")) {
        throw new Error(`Unsafe path in template archive: '${entryName}'.`);
    }

    const destination = path.resolve(destinationRoot, ...segments);
    if (destination !== destinationRoot &&
        !destination.startsWith(destinationRoot + path.sep)) {
        throw new Error(`Unsafe path in template archive: '${entryName}'.`);
    }
    return destination;
}

export function extractTemplate(zipPath, destination) {
    console.log("Extracting template...");
    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries();
    if (entries.length === 0) throw new Error("Template archive is empty.");

    const firstEntry = entries.find(entry => entry.entryName);
    const firstPath = firstEntry.entryName.replace(/\\/g, "/");
    const rootDirectory = firstPath.split("/")[0];
    if (!rootDirectory || rootDirectory === "." || rootDirectory === "..") {
        throw new Error("Template archive has an invalid root directory.");
    }

    const destinationRoot = path.resolve(destination);
    for (const entry of entries) {
        const targetPath = resolveArchiveEntryPath(entry.entryName, rootDirectory, destinationRoot);
        if (!targetPath) continue;

        if (entry.isDirectory) {
            fs.mkdirSync(targetPath, { recursive: true });
        } else {
            fs.mkdirSync(path.dirname(targetPath), { recursive: true });
            fs.writeFileSync(targetPath, entry.getData());
        }
    }
    console.log("Template extracted successfully.");
}
