import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { taskManager, type Task } from '@prj--personal-portfolio--v3/shared--taskManager';
import cleanRepoDir from './helpers/cleanRepoDir.ts';
import clonePrivateRepo from './helpers/clonePrivateRepo.ts';
import cleanupUnnecessary from './helpers/cleanupUnnecessary.ts';

dotenv.config({
    path: '../../.env',
});

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const CONTENT_REPO_URL = process.env.CONTENT_REPO_GIT_URL;
const TARGET_DIR = path.resolve('../../content/live');

const setup = () => {
    if (!GITHUB_TOKEN) {
        console.error('GITHUB_TOKEN is not set in environment variables.');
        process.exit(1);
    }

    if (!CONTENT_REPO_URL) {
        console.error('CONTENT_REPO_GIT_URL is not set in environment variables.');
        process.exit(1);
    }

    if (!fs.existsSync(TARGET_DIR)) {
        fs.mkdirSync(TARGET_DIR, { recursive: true });
    }
};

const tasks: Task[] = [
    {
        name: 'Setup Environment',
        action: setup,
        dependsOn: [],
    },
    {
        name: 'Clean Repository Directory',
        action: () => cleanRepoDir(TARGET_DIR),
        dependsOn: ['Setup Environment'],
    },
    {
        name: 'Clone Private Repository',
        action: () => clonePrivateRepo(CONTENT_REPO_URL!, TARGET_DIR, GITHUB_TOKEN!),
        dependsOn: ['Clean Repository Directory'],
    },
    {
        name: 'Remove Unnecessary Repository Files',
        action: () => cleanupUnnecessary(path.join(TARGET_DIR, ), ['content']),
        dependsOn: ['Clone Private Repository'],
    },
    {
        name: 'Remove Unnecessary Content Files',
        action: () => cleanupUnnecessary(path.join(TARGET_DIR, 'content'), ['publish']),
        dependsOn: ['Clone Private Repository'],
    },
];

const main = async () => {
    const executor = taskManager().init(tasks);
    await executor.execute();
};

main();
