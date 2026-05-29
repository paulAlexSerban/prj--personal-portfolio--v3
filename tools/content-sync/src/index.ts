import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({
    path: '../../.env',
});

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const CONTENT_REPO_URL = process.env.CONTENT_REPO_GIT_URL;
const TARGET_DIR = path.resolve('../../content/live');

const main = () => {
    console.log({
        GITHUB_TOKEN,
        CONTENT_REPO_URL,
        TARGET_DIR,
    });
};

main();
