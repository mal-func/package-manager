import axios from "axios";
import fs from "fs";

const REPOSITORY =
    "https://github.com/mal-func/cdis-template-edit";

export async function downloadTemplate(destination, version = "main") {
    const templateUrl =
        `${REPOSITORY}/archive/refs/tags/${version}.zip`;

    console.log(`Downloading CDIS template version: ${version}`);

    const response = await axios.get(templateUrl, {
        responseType: "arraybuffer"
    });

    fs.writeFileSync(destination, response.data);

    console.log("Template downloaded successfully.");
}