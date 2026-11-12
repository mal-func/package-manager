import { validateManifest } from "./manifest.js";

function resolveOption(options, requestedId, label) {
    if (requestedId !== undefined && requestedId !== null) {
        if (typeof requestedId !== "string" || requestedId.trim() === "") {
            throw new Error(`Please provide a valid ${label} id.`);
        }
        const option = options.find(item => item.id === requestedId);
        if (!option) {
            throw new Error(`Unknown ${label} '${requestedId}'. Available options: ${options.map(item => item.id).join(", ")}.`);
        }
        return option;
    }
    return options.find(option => option.default === true);
}

export function resolveTechnologySelection(manifest, { frontend, backend } = {}) {
    validateManifest(manifest);
    if (!Array.isArray(manifest.frontends) || !Array.isArray(manifest.backends)) {
        throw new Error("This template does not support technology selection.");
    }

    const selectedFrontend = resolveOption(manifest.frontends, frontend, "frontend");
    const selectedBackend = resolveOption(manifest.backends, backend, "backend");
    const compatibilityChecked = manifest.compatibility !== undefined;

    if (compatibilityChecked &&
        !manifest.compatibility[selectedFrontend.id].includes(selectedBackend.id)) {
        throw new Error(`The combination frontend '${selectedFrontend.id}' and backend '${selectedBackend.id}' is not supported by this template.`);
    }

    return {
        frontend: selectedFrontend,
        backend: selectedBackend,
        compatibilityChecked
    };
}
