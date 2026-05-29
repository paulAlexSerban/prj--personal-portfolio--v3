const path = require('path');
const fs = require('fs');
const dotendv = require('dotenv');
const { cleanRepoDir, clonePrivateRepo, removeFiles, getExecutionOrder } = require('./utils');

dotendv.config();

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const CONTENT_REPO_URL = process.env.CONTENT_REPO_GIT_URL;
const TARGET_DIR = path.resolve('content/live');

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

const tasks = [
    { name: 'Setup Environment', action: setup, dependsOn: [] },
    { name: 'Clean Repository Directory', action: () => cleanRepoDir(TARGET_DIR), dependsOn: ['Setup Environment'] },
    {
        name: 'Clone Private Repository',
        action: () => clonePrivateRepo(CONTENT_REPO_URL, TARGET_DIR, GITHUB_TOKEN),
        dependsOn: ['Clean Repository Directory'],
    },
    {
        name: 'Remove Unnecessary Files',
        action: () => removeFiles(path.join(TARGET_DIR), ['content']),
        dependsOn: ['Clone Private Repository'],
    },
];

function main() {
    const executionOrder = getExecutionOrder(tasks);
    executionOrder.forEach((task) => {
        console.log(`Starting task: ${task.name}`);
        task.action();
        console.log(`Completed task: ${task.name}`);
    });
}

main();
