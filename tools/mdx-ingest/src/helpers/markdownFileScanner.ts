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

/** Directories skipped when collecting ordinary parent content (posts etc.). */
const SKIP_CONTENT_DIRS = new Set(['questions', 'intermediary', 'cheat_sheet', 'learning_plan']);

/** Flat companion filenames (e.g. cheat_sheet.mdx next to the post MDX). */
const FLAT_CHEAT_SHEET_BASENAMES = new Set(['cheat_sheet.mdx', 'cheat_sheet.md']);

const isMarkdownFile = (fileName: string): boolean => fileName.endsWith('.mdx') || fileName.endsWith('.md');

const collectContentMarkdownFiles = async (dir: string, rootDir = dir): Promise<string[]> => {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
        const entryPath = path.join(dir, entry.name);

        if (entry.isDirectory()) {
            if (SKIP_CONTENT_DIRS.has(entry.name)) {
                continue;
            }

            files.push(...(await collectContentMarkdownFiles(entryPath, rootDir)));
            continue;
        }

        if (isMarkdownFile(entry.name)) {
            if (FLAT_CHEAT_SHEET_BASENAMES.has(entry.name)) {
                continue;
            }
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

/**
 * Collect companion MDX files for a given companion folder name (`cheat_sheet` or `learning_plan`).
 * Supports:
 * - flat file: `<postDir>/cheat_sheet.mdx` (cheat sheets only)
 * - folder: `<postDir>/<companionDirName>/*.mdx`
 */
const collectCompanionFiles = async (typeDir: string, typeName: string, companionDirName: 'cheat_sheet' | 'learning_plan'): Promise<string[]> => {
    const files: string[] = [];

    const walk = async (dir: string): Promise<void> => {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
            const entryPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                if (entry.name === companionDirName) {
                    const companionEntries = await fs.readdir(entryPath, { withFileTypes: true });

                    for (const companionEntry of companionEntries) {
                        if (!companionEntry.isFile() || !isMarkdownFile(companionEntry.name)) {
                            continue;
                        }

                        const companionPath = path.join(entryPath, companionEntry.name);
                        const relativeFromPublish = path.join(typeName, path.relative(typeDir, companionPath));
                        files.push(relativeFromPublish);
                    }

                    continue;
                }

                // Skip nested questions / intermediary / other companion dirs while walking
                if (SKIP_CONTENT_DIRS.has(entry.name)) {
                    continue;
                }

                await walk(entryPath);
                continue;
            }

            // Flat cheat_sheet.mdx only (not learning_plan - those live in a folder)
            if (companionDirName === 'cheat_sheet' && entry.isFile() && FLAT_CHEAT_SHEET_BASENAMES.has(entry.name)) {
                const relativeFromPublish = path.join(typeName, path.relative(typeDir, entryPath));
                files.push(relativeFromPublish);
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
        const cheatSheetFiles: string[] = [];
        const learningPlanFiles: string[] = [];
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
                cheatSheetFiles.push(...(await collectCompanionFiles(typePath, typeDir.name, 'cheat_sheet')));
                learningPlanFiles.push(...(await collectCompanionFiles(typePath, typeDir.name, 'learning_plan')));
            }
        }

        if (nestedQuestionFiles.length > 0) {
            result.push({
                typeName: 'questions',
                path: baseDir,
                files: nestedQuestionFiles,
            });
        }

        if (cheatSheetFiles.length > 0) {
            result.push({
                typeName: 'cheat_sheets',
                path: baseDir,
                files: cheatSheetFiles,
            });
        }

        if (learningPlanFiles.length > 0) {
            result.push({
                typeName: 'learning_plans',
                path: baseDir,
                files: learningPlanFiles,
            });
        }

        return result;
    };
