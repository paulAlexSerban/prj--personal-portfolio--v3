const { execSync } = require('child_process');

function cleanRepoDir(targetDir) {
    try {
        execSync(`rm -rf ${targetDir}`, { stdio: 'inherit' });
        console.log(`Cleaned existing directory: ${targetDir}`);
    } catch (error) {
        console.error('Failed to clean directory:', error instanceof Error ? error.message : String(error));
        throw error;
    }
}

module.exports = cleanRepoDir;
