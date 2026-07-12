import fs from 'node:fs/promises';
import path from 'node:path';

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

const QUESTION_PARENT_TYPES = new Set(['posts', 'booknotes', 'snippets']);

const isMarkdownFile = (fileName: string): boolean => fileName.endsWith('.mdx') || fileName.endsWith('.md');

const collectContentMarkdownFiles = async (dir: string, rootDir = dir): Promise<string[]> => {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
        const entryPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            if (entry.name === 'questions') {
                continue;
            }

            files.push(...(await collectContentMarkdownFiles(entryPath, rootDir)));
            continue;
        }

        if (isMarkdownFile(entry.name)) {
            files.push(path.relative(rootDir, entryPath));
        }
    }

    return files;
};

const collectNestedQuestionFiles = async (typeDir: string, typeName: string): Promise<string[]> => {
    const files: string[] = [];

    const walk = async (dir: string): Promise<void> => {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const entryPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                if (entry.name === 'questions') {
                    const questionEntries = await fs.readdir(entryPath, { withFileTypes: true });

                    for (const questionEntry of questionEntries) {
                        if (!questionEntry.isFile() || !isMarkdownFile(questionEntry.name)) {
                            continue;
                        }

                        const questionPath = path.join(entryPath, questionEntry.name);
                        const relativeFromPublish = path.join(typeName, path.relative(typeDir, questionPath));
                        files.push(relativeFromPublish);
                    }

                    continue;
                }

                await walk(entryPath);
            }
        }
    };

    await walk(typeDir);
    return files;
};

export const markdownFilesScanner =
    ({ baseDir, sourceFolders, typePattern = /^(projects|coursework|posts|booknotes|snippets)$/ }: DirectoryPath) =>
    async (): Promise<ScannedDirectory[]> => {
        const result: ScannedDirectory[] = [];
        const nestedQuestionFiles: string[] = [];
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
            const files = await collectContentMarkdownFiles(typePath);

            result.push({
                typeName: typeDir.name,
                path: typePath,
                files,
            });

            if (QUESTION_PARENT_TYPES.has(typeDir.name)) {
                nestedQuestionFiles.push(...(await collectNestedQuestionFiles(typePath, typeDir.name)));
            }
        }

        if (nestedQuestionFiles.length > 0) {
            result.push({
                typeName: 'questions',
                path: baseDir,
                files: nestedQuestionFiles,
            });
        }

        return result;
    };
