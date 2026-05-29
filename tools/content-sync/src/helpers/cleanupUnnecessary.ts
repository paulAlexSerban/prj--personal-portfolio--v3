import { execSync } from "child_process";
import path from "path";
import fs from "fs";

const cleanupUnnecessary = (targetDir: string, exceptions: string[] = []): void => {
  const items = fs.readdirSync(targetDir);

  items.forEach((item: string) => {
    if (!exceptions.includes(item)) {
      const itemPath = path.join(targetDir, item);
      execSync(`rm -rf ${itemPath}`, { stdio: "inherit" });
      console.log(`Removed: ${itemPath}`);
    }
  });
};

export default cleanupUnnecessary;