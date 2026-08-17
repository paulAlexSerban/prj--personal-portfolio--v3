import fs from 'node:fs/promises';
import path from 'node:path';

export async function writeKeyFile(distDir: string, key: string): Promise<string> {
    const filePath = path.join(distDir, `${key}.txt`);
    await fs.mkdir(distDir, { recursive: true });
    await fs.writeFile(filePath, key, 'utf8');
    return filePath;
}
