const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function removeFiles(targetDir, exceptions = []) {
    const items = fs.readdirSync(targetDir);

    items.forEach((item) => {
        if (!exceptions.includes(item)) {
            const itemPath = path.join(targetDir, item);
            execSync(`rm -rf ${itemPath}`, { stdio: 'inherit' });
            console.log(`Removed: ${itemPath}`);
        }
    });
}

module.exports = removeFiles;
