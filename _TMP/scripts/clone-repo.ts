import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import dotendv from "dotenv";

// Load environment variables from .env file
dotendv.config();

function cleanRepoDir(targetDir: string) {
  try {
    execSync(`rm -rf ${targetDir}`, { stdio: "inherit" });
    console.log(`Cleaned existing directory: ${targetDir}`);
  } catch (error) {
    console.error(
      "Failed to clean directory:",
      error instanceof Error ? error.message : String(error),
    );
    throw error;
  }
}

function clonePrivateRepo(repoUrl: string, targetDir: string, token: string) {
  // Insert token into URL
  const authenticatedUrl = repoUrl.replace(
    "https://github.com/",
    `https://${token}@github.com/`,
  );

  try {
    execSync(`git clone ${authenticatedUrl} ${targetDir}`, {
      stdio: "inherit",
    });
    console.log(`Successfully cloned to ${targetDir}`);
  } catch (error) {
    console.error(
      "Failed to clone repository:",
      error instanceof Error ? error.message : String(error),
    );
    throw error;
  }
}

function removeUnnecessaryFiles(targetDir: string, exceptions: string[] = []) {
  const items = fs.readdirSync(targetDir);

  items.forEach((item: string) => {
    if (!exceptions.includes(item)) {
      const itemPath = path.join(targetDir, item);
      execSync(`rm -rf ${itemPath}`, { stdio: "inherit" });
      console.log(`Removed: ${itemPath}`);
    }
  });
}

function main() {
  const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
  const CONTENT_REPO_URL = process.env.CONTENT_REPO_GIT_URL;

  if (!GITHUB_TOKEN) {
    console.error("GITHUB_TOKEN is not set in environment variables.");
    process.exit(1);
  }

  if (!CONTENT_REPO_URL) {
    console.error("CONTENT_REPO_GIT_URL is not set in environment variables.");
    process.exit(1);
  }
  const TARGET_DIR = path.resolve("content-source");

  cleanRepoDir(TARGET_DIR);
  clonePrivateRepo(CONTENT_REPO_URL, TARGET_DIR, GITHUB_TOKEN);
  removeUnnecessaryFiles(path.join(TARGET_DIR), ["assets","content"]);
  removeUnnecessaryFiles(path.join(TARGET_DIR, "content"), ["publish"]);
}

main();
