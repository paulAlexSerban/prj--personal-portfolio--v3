const { execSync } = require('child_process');

function clonePrivateRepo(repoUrl, targetDir, token) {
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

module.exports = clonePrivateRepo;
