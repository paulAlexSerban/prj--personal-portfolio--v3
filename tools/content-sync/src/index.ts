import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

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

const tasks = [{ name: 'Setup Environment', action: setup, dependsOn: [] }];

const executionManager = () => {
    const init = (tasks) => {
        const order = [];
        const visited = new Set();

        const visit = (task) => {
            if (visited.has(task.name)) return;
            visited.add(task.name);
            task.dependsOn.forEach((dep) => {
                const depTask = tasks.find((t) => t.name === dep);
                if (depTask) visit(depTask);
            });
            order.push(task);
        };

        tasks.forEach(visit);
        return order;
    };

    return {
        init,
    };
};

const main = () => {};

main();
