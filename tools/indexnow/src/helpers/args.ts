export type CliArgs = {
    dist: string;
    site?: string;
    dryRun: boolean;
    writeKey: boolean;
    submit: boolean;
};

export function parseArgs(argv: string[]): CliArgs {
    const args: CliArgs = {
        dist: '',
        dryRun: false,
        writeKey: false,
        submit: false,
    };

    for (let i = 0; i < argv.length; i += 1) {
        const token = argv[i];
        // pnpm 11 forwards the `--` script-arg separator to node.
        if (token === '--') {
            continue;
        }
        if (token === '--dry-run') {
            args.dryRun = true;
            continue;
        }
        if (token === '--write-key') {
            args.writeKey = true;
            continue;
        }
        if (token === '--submit') {
            args.submit = true;
            continue;
        }
        if (token === '--dist') {
            const value = argv[i + 1];
            if (!value || value.startsWith('--')) {
                throw new Error('--dist requires a path');
            }
            args.dist = value;
            i += 1;
            continue;
        }
        if (token === '--site') {
            const value = argv[i + 1];
            if (!value || value.startsWith('--')) {
                throw new Error('--site requires a URL');
            }
            args.site = value;
            i += 1;
            continue;
        }
        if (token?.startsWith('--')) {
            throw new Error(`Unknown flag: ${token}`);
        }
        throw new Error(`Unexpected argument: ${token}`);
    }

    if (!args.dist) {
        throw new Error('--dist is required');
    }
    if (!args.writeKey && !args.submit) {
        throw new Error('Specify --write-key and/or --submit');
    }
    if (args.submit && !args.site) {
        throw new Error('--site is required with --submit');
    }

    return args;
}
