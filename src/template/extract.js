import AdmZip from "adm-zip";
import fs from "fs";
import path from "path";

export function extractTemplate(zipPath, destination) {
    console.log("Extracting template...");
    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries();
    if (entries.length === 0) throw new Error("Template archive is empty.");

    const firstEntry = entries.find(entry => entry.entryName);
    const firstPath = firstEntry.entryName.replace(/\\\\/g, "/");
    const rootDirectory = firstPath.split("/")[0];
    if (!rootDirectory || rootDirectory === "." || rootDirectory === "..") {
        throw new Error("Template archive has an invalid root directory.");
    }

    const destinationRoot = path.resolve(destination);
    for (const entry of entries) {
        const archivePath = entry.entryName.replace(/\\\\/g, "/");
        const relativePath = archivePath.substring(rootDirectory.length + 1);
        if (!relativePath) continue;

        const segments = relativePath.split("/");
        if (archivePath.startsWith("/") || segments.some(segment => segment === "..")) {
            throw new Error(`Unsafe path in template archive: '${entry.entryName}'.`);
        }

        const targetPath = path.resolve(destinationRoot, ...segments);
        if (targetPath !== destinationRoot &&
            !targetPath.startsWith(destinationRoot + path.sep)) {
            throw new Error(`Unsafe path in template archive: '${entry.entryName}'.`);
        }

        if (entry.isDirectory) {
            fs.mkdirSync(targetPath, { recursive: true });
        } else {
            fs.mkdirSync(path.dirname(targetPath), { recursive: true });
            fs.writeFileSync(targetPath, entry.getData());
        }
    }
    console.log("Template extracted successfully.");
}
