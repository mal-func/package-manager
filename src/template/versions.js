import axios from "axios";

const REPOSITORY_API =
    "https://api.github.com/repos/mal-func/cdis-template-edit";

export async function getTemplateVersions() {
    try {
        const response = await axios.get(
            `${REPOSITORY_API}/tags?per_page=100`,
            {
                headers: {
                    Accept: "application/vnd.github+json"
                }
            }
        );

        return response.data.map(tag => tag.name);
    } catch (error) {
        throw new Error(
            `Could not retrieve template versions: ${
                error.response?.status
                    ? `GitHub returned HTTP ${error.response.status}`
                    : error.message
            }`
        );
    }
}