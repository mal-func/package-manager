import axios from "axios";
import fs from "fs";

const REPOSITORY =
    "https://github.com/mal-func/cdis-template-edit";

export async function downloadTemplate(destination, ref = "v1.0.0", refType = "tags") {
    if (!["tags", "heads"].includes(refType)) {
        throw new Error("Template ref type must be 'tags' or 'heads'.");
    }
    if (typeof ref !== "string" || ref.trim() === "" || ref.includes("..")) {
        throw new Error("Please provide a valid template version or branch.");
    }

    const templateUrl = `${REPOSITORY}/archive/refs/${refType}/${encodeURIComponent(ref)}.zip`;
    console.log(`Downloading CDIS template ${refType === "tags" ? "version" : "branch"}: ${ref}`);

    const response = await axios.get(templateUrl, { responseType: "arraybuffer" });
    fs.writeFileSync(destination, response.data);
    console.log("Template downloaded successfully.");
}
