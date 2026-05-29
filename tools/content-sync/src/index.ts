import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { taskManager, type Task } from './helpers/taskManager';

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
    { name: 'Setup Environment', action: setup, dependsOn: [] },
    { name: 'Clean Repository Directory', action: () => console.log('Clean Repository Directory'), dependsOn: ['Setup Environment'] },
    {
        name: 'Clone Private Repository',
        action: () => console.log('Clone Private Repository'),
        dependsOn: ['Clean Repository Directory'],
    },
    {
        name: 'Remove Unnecessary Files',
        action: () => console.log('Remove Unnecessary Files'),
        dependsOn: ['Clone Private Repository'],
    },
];

const main = async () => {
    const executor = taskManager().init(tasks);
    await executor.execute();
};

main();
