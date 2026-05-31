import { execSync } from 'node:child_process';

function clonePrivateRepo(repoUrl: string, targetDir: string, token: string) {
    const authenticatedUrl = repoUrl.replace('https://github.com/', `https://${token}@github.com/`);

    try {
        execSync(`git clone ${authenticatedUrl} ${targetDir}`, {
            stdio: 'inherit',
        });
        console.log(`Successfully cloned to ${targetDir}`);
    } catch (error) {
        console.error('Failed to clone repository:', error instanceof Error ? error.message : String(error));
        throw error;
    }
}

export default clonePrivateRepo;
