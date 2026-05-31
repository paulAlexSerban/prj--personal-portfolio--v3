import { execSync } from 'node:child_process';

function cleanRepoDir(targetDir: string) {
    try {
        execSync(`rm -rfv ${targetDir}`, { stdio: 'inherit' });
        console.log(`Cleaned existing directory: ${targetDir}`);
    } catch (error) {
        console.error('Failed to clean directory:', error instanceof Error ? error.message : String(error));
        throw error;
    }
}

export default cleanRepoDir;
