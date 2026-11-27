import { createInterface } from "node:readline/promises";

function getLabel(option) {
    return option.name || option.label || option.id;
}

async function askForOption(askQuestion, message, options, defaultId, output) {
    if (options.length === 0) throw new Error(`No available choices for ${message.toLowerCase()}.`);
    const defaultIndex = Math.max(0, options.findIndex(option => option.id === defaultId));
    const choices = options.map((option, index) =>
        `  ${index + 1}) ${getLabel(option)}${index === defaultIndex ? " (default)" : ""}`
    );
    while (true) {
        output.write(`\n${message}\n${choices.join("\n")}\n`);
        const answer = (await askQuestion(`Choose 1-${options.length} [${defaultIndex + 1}]: `)).trim();
        if (answer === "") return options[defaultIndex];
        const choice = Number(answer);
        if (Number.isInteger(choice) && choice >= 1 && choice <= options.length) return options[choice - 1];
        output.write(`Please enter a number between 1 and ${options.length}, or press Enter for the default.\n`);
    }
}

async function askYesNo(askQuestion, message, output) {
    while (true) {
        const answer = (await askQuestion(`${message} [y/N]: `)).trim().toLowerCase();
        if (answer === "" || answer === "n" || answer === "no") return false;
        if (answer === "y" || answer === "yes") return true;
        output.write("Please answer y or n.\n");
    }
}

/** Collect missing selections; manifest rules remain the source of truth. */
export async function promptForTechnologies(manifest, {
    frontend, backend, input = process.stdin, output = process.stdout, askQuestion
} = {}) {
    const needsFrontend = frontend === undefined;
    const needsBackend = backend === undefined;
    if (!needsFrontend && !needsBackend) return { frontend, backend };
    let rl;
    const ask = askQuestion || (message => rl.question(message));
    if (!askQuestion) rl = createInterface({ input, output });
    try {
        let selectedFrontend = frontend;
        if (needsFrontend) {
            const choices = backend && manifest.compatibility
                ? manifest.frontends.filter(option => manifest.compatibility[option.id]?.includes(backend))
                : manifest.frontends;
            const defaultId = choices.find(option => option.default)?.id || choices[0]?.id;
            selectedFrontend = (await askForOption(ask, "Which frontend would you like to use?", choices, defaultId, output)).id;
        }
        let selectedBackend = backend;
        if (needsBackend) {
            const compatibleIds = manifest.compatibility?.[selectedFrontend];
            const choices = compatibleIds
                ? manifest.backends.filter(option => compatibleIds.includes(option.id))
                : manifest.backends;
            const defaultId = choices.find(option => option.default)?.id || choices[0]?.id;
            selectedBackend = (await askForOption(ask, "Which backend would you like to use?", choices, defaultId, output)).id;
        }
        return { frontend: selectedFrontend, backend: selectedBackend };
    } finally {
        rl?.close();
    }
}

/** Only asks users to choose when a template declares multiple supported tools. */
export async function promptForTooling(manifest, technologySelection, {
    frontendLinter, backendLinter, prettier = false, ruffFormat = false,
    input = process.stdin, output = process.stdout, askQuestion
} = {}) {
    const frontendOptions = manifest.tooling?.frontends?.[technologySelection.frontend.id]?.linting?.options ?? [];
    const backendOptions = manifest.tooling?.backends?.[technologySelection.backend.id]?.linting?.options ?? [];
    const needsFrontend = frontendLinter === undefined && frontendOptions.length > 1;
    const needsBackend = backendLinter === undefined && backendOptions.length > 1;
    const needsPrettier = !prettier && technologySelection.frontend.id !== undefined;
    const needsRuffFormat = !ruffFormat && technologySelection.backend.id === "fastapi";
    if (!needsFrontend && !needsBackend && !needsPrettier && !needsRuffFormat) {
        return { frontendLinter, backendLinter, prettier, ruffFormat };
    }

    let rl;
    const ask = askQuestion || (message => rl.question(message));
    if (!askQuestion) rl = createInterface({ input, output });
    try {
        let selectedFrontendLinter = frontendLinter;
        if (needsFrontend) {
            const defaultId = frontendOptions.find(option => option.default)?.id || frontendOptions[0].id;
            selectedFrontendLinter = (await askForOption(ask, "Which frontend linter would you like to use?", frontendOptions, defaultId, output)).id;
        }
        let selectedBackendLinter = backendLinter;
        if (needsBackend) {
            const defaultId = backendOptions.find(option => option.default)?.id || backendOptions[0].id;
            selectedBackendLinter = (await askForOption(ask, "Which backend linter would you like to use?", backendOptions, defaultId, output)).id;
        }
        let selectedPrettier = prettier;
        if (needsPrettier) selectedPrettier = await askYesNo(ask, "Would you like to add optional Prettier formatting?", output);
        let selectedRuffFormat = ruffFormat;
        if (needsRuffFormat) selectedRuffFormat = await askYesNo(ask, "Would you like to enable optional Ruff formatting for FastAPI?", output);
        return {
            frontendLinter: selectedFrontendLinter,
            backendLinter: selectedBackendLinter,
            prettier: selectedPrettier,
            ruffFormat: selectedRuffFormat
        };
    } finally {
        rl?.close();
    }
}
