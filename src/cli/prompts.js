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
