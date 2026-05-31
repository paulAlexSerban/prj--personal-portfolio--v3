import fs from 'fs/promises';
import path from 'path';

export type DirectoryPath = {
    baseDir: string;
    sourceFolders?: string[];
    typePattern?: RegExp;
};

export type ScannedDirectory = {
    typeName: string;
    path: string;
    files: string[];
};

const isJsonFile = (fileName: string): boolean => fileName.endsWith('.json');

const collectJsonFiles = async (dir: string, rootDir = dir): Promise<string[]> => {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
        const entryPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            files.push(...(await collectJsonFiles(entryPath, rootDir)));
            continue;
        }

        if (isJsonFile(entry.name)) {
            files.push(path.relative(rootDir, entryPath));
        }
    }

    return files;
};

export const jsonFilesScanner =
    ({ baseDir, sourceFolders, typePattern = /^(profile|skills|pages)$/ }: DirectoryPath) =>
    async (): Promise<ScannedDirectory[]> => {
        const result: ScannedDirectory[] = [];
        const entries = await fs.readdir(baseDir, { withFileTypes: true });
        const typeDirs = entries.filter((entry) => {
            if (!entry.isDirectory()) {
                return false;
            }

            if (sourceFolders?.length) {
                return sourceFolders.includes(entry.name);
            }

            return typePattern.test(entry.name);
        });

        for (const typeDir of typeDirs) {
            const typePath = path.join(baseDir, typeDir.name);
            const files = await collectJsonFiles(typePath);

            result.push({
                typeName: typeDir.name,
                path: typePath,
                files,
            });
        }

        return result;
    };
