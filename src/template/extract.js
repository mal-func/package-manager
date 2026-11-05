import AdmZip from "adm-zip";
import fs from "fs";
import path from "path";

export function extractTemplate(zipPath, destination) {
    console.log("Extracting template...");

    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries();

    // Find the common top-level directory in the GitHub archive
    const rootDirectory = entries[0].entryName.split("/")[0];

    for (const entry of entries) {
        const relativePath = entry.entryName.substring(rootDirectory.length + 1);

        // Skip the root directory itself
        if (!relativePath) continue;

        const targetPath = path.join(destination, relativePath);

        if (entry.isDirectory) {
            fs.mkdirSync(targetPath, { recursive: true });
        } else {
            fs.mkdirSync(path.dirname(targetPath), { recursive: true });
            fs.writeFileSync(targetPath, entry.getData());
        }
    }

    console.log("Template extracted successfully.");
}