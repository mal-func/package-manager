const DEFAULT_TEMPLATE_REPOSITORY = "mal-func/cdis-template-edit";
const DEFAULT_TEMPLATE_BRANCH = "main";
const REPOSITORY_PATTERN = /^[A-Za-z0-9-]+\/[A-Za-z0-9._-]+$/;

export function resolveTemplateRepository(value = process.env.CDIS_TEMPLATE_REPOSITORY) {
    if (value === undefined || value.trim() === "") return DEFAULT_TEMPLATE_REPOSITORY;
    const repository = value.trim();
    if (!REPOSITORY_PATTERN.test(repository)) {
        throw new Error("CDIS_TEMPLATE_REPOSITORY must use the owner/repository format, for example 'my-org/my-template'.");
    }
    return repository;
}

export function resolveTemplateBranch(value = process.env.CDIS_TEMPLATE_BRANCH) {
    return value === undefined || value.trim() === "" ? DEFAULT_TEMPLATE_BRANCH : value.trim();
}

export const TEMPLATE_REPOSITORY = resolveTemplateRepository();
export const DEFAULT_TEMPLATE_BRANCH = resolveTemplateBranch();
export const TEMPLATE_API_BASE = `https://api.github.com/repos/${TEMPLATE_REPOSITORY}`;
export const TEMPLATE_RAW_BASE = `https://raw.githubusercontent.com/${TEMPLATE_REPOSITORY}`;
export const TEMPLATE_ARCHIVE_BASE = `https://github.com/${TEMPLATE_REPOSITORY}`;
