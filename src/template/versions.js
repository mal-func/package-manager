import axios from "axios";
import { TEMPLATE_API_BASE } from "../config.js";

export async function getTemplateVersions() {
    try {
        const response = await axios.get(
            `${TEMPLATE_API_BASE}/tags?per_page=100`,
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