import AdmZip from "adm-zip";
import fs from "fs";
import path from "path";

export function extractTemplate(zipPath, destination) {
    console.log("Extracting template...");
    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries();

    if (entries.length === 0) {
        throw new Error("Template archive is empty.");
    }

    // GitHub source archives contain a single wrapper directory.
    const firstEntry = entries.find(entry => entry.entryName);
    const rootDirectory = firstEntry.entryName.split("/")[0];
    const destinationRoot = path.resolve(destination);

    for (const entry of entries) {
        const relativePath = entry.entryName.substring(rootDirectory.length + 1);
        if (!relativePath) continue;

        const targetPath = path.resolve(destinationRoot, relativePath);
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
