import { createInterface } from "node:readline/promises";

function getLabel(option) {
    return option.name || option.label || option.id;
}

async function askForOption(rl, message, options, defaultId, output) {
    if (options.length === 0) {
        throw new Error(`No available choices for ${message.toLowerCase()}.`);
    }

    const defaultIndex = Math.max(0, options.findIndex(option => option.id === defaultId));
    const choices = options.map((option, index) =>
        `  ${index + 1}) ${getLabel(option)}${index === defaultIndex ? " (default)" : ""}`
    );

    while (true) {
        output.write(`\n${message}\n${choices.join("\n")}\n`);
        const answer = (await rl.question(`Choose 1-${options.length} [${defaultIndex + 1}]: `)).trim();
        if (answer === "") return options[defaultIndex];

        const choice = Number(answer);
        if (Number.isInteger(choice) && choice >= 1 && choice <= options.length) {
            return options[choice - 1];
        }
        output.write(`Please enter a number between 1 and ${options.length}, or press Enter for the default.\n`);
    }
}

/**
 * Collects only technology choices not supplied through CLI flags.
 * The manifest defines available choices and compatibility; the existing
 * selection resolver remains responsible for final validation.
 */
export async function promptForTechnologies(manifest, {
    frontend,
    backend,
    input = process.stdin,
    output = process.stdout
} = {}) {
    const needsFrontend = frontend === undefined;
    const needsBackend = backend === undefined;
    if (!needsFrontend && !needsBackend) return { frontend, backend };

    const rl = createInterface({ input, output });
    try {
        let selectedFrontend = frontend;
        if (needsFrontend) {
            const compatibleFrontends = backend && manifest.compatibility
                ? manifest.frontends.filter(option => manifest.compatibility[option.id]?.includes(backend))
                : manifest.frontends;
            const defaultFrontend = compatibleFrontends.find(option => option.default)?.id
                || compatibleFrontends[0]?.id;
            const choice = await askForOption(
                rl,
                "Which frontend would you like to use?",
                compatibleFrontends,
                defaultFrontend,
                output
            );
            selectedFrontend = choice.id;
        }

        let selectedBackend = backend;
        if (needsBackend) {
            const compatibleIds = manifest.compatibility?.[selectedFrontend];
            const availableBackends = compatibleIds
                ? manifest.backends.filter(option => compatibleIds.includes(option.id))
                : manifest.backends;
            const defaultBackend = availableBackends.find(option => option.default)?.id
                || availableBackends[0]?.id;
            const choice = await askForOption(
                rl,
                "Which backend would you like to use?",
                availableBackends,
                defaultBackend,
                output
            );
            selectedBackend = choice.id;
        }

        return { frontend: selectedFrontend, backend: selectedBackend };
    } finally {
        rl.close();
    }
}
