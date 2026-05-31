import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const cleanupUnnecessary = (targetDir: string, exceptions: string[] = []): void => {
    const items = fs.readdirSync(targetDir);

    items.forEach((item: string) => {
        if (!exceptions.includes(item)) {
            const itemPath = path.join(targetDir, item);
            execSync(`rm -rf ${itemPath}`, { stdio: 'inherit' });
            console.log(`Removed: ${itemPath}`);
        }
    });
};

export default cleanupUnnecessary;
