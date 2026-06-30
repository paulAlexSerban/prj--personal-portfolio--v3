import { execSync } from 'node:child_process';

function clonePrivateRepo(repoUrl: string, targetDir: string, token: string) {
    const url = new URL(repoUrl);
    url.username = 'x-access-token';
    url.password = token;

    try {
        execSync(`git clone --depth 1 ${JSON.stringify(url.toString())} ${JSON.stringify(targetDir)}`, {
            stdio: 'inherit',
            env: { ...process.env, GIT_TERMINAL_PROMPT: '0' },
        });
        console.log(`Successfully cloned to ${targetDir}`);
    } catch (error) {
        console.error('Failed to clone repository:', error instanceof Error ? error.message : String(error));
        throw error;
    }
}

export default clonePrivateRepo;
