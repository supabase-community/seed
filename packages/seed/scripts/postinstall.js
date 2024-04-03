/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/prefer-promise-reject-errors */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import childProcess from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// @ts-expect-error - No types
function run(cmd, params, cwd = process.cwd()) {
  const child = childProcess.spawn(cmd, params, {
    stdio: ["pipe", "inherit", "inherit"],
    cwd,
  });

  return new Promise((resolve, reject) => {
    child.on("close", () => {
      resolve(undefined);
    });
    child.on("exit", (code) => {
      if (code === 0) {
        resolve(undefined);
      } else {
        reject(code);
      }
    });
    child.on("error", () => {
      reject();
    });
  });
}

/**
 * Adds `package.json` to the end of a path if it doesn't already exist'
 * @param {string} pth
 */
function addPackageJSON(pth) {
  if (pth.endsWith("package.json")) return pth;
  return path.join(pth, "package.json");
}

/**
 * Read the content of a package.json
 * @param {string} pth - Path to the `package.json`
 * @returns {any | null}
 */
function readPackageJSON(pth) {
  try {
    return JSON.parse(fs.readFileSync(pth, "utf-8"));
  } catch {
    return null;
  }
}

/**
 * Looks up for a `package.json` which is not `@snaplet/seed` and returns the directory of the package
 * @param {string | null} startPath - Path to Start At
 * @param {number} limit - Find Up limit
 * @returns {string | null}
 */
function findPackageRoot(startPath, limit = 10) {
  if (!startPath || !fs.existsSync(startPath)) return null;
  let currentPath = startPath;
  // Limit traversal
  for (let i = 0; i < limit; i++) {
    const pkgPath = addPackageJSON(currentPath);
    if (fs.existsSync(pkgPath)) {
      try {
        const pkg = readPackageJSON(pkgPath);
        if (pkg.name && !["@snaplet/seed"].includes(pkg.name)) {
          return pkgPath.replace("package.json", "");
        }
      } catch {}
    }
    currentPath = path.join(currentPath, "../");
  }
  return null;
}

/**
 * Looks up for a `package.json` which is not `@prisma/cli` or `prisma` and returns the directory of the package
 * @param {string} root - Path to Start At
 * @returns {boolean}
 */
function haveValidSeedProject(root) {
  const seedConfigPath = path.join(root, "seed.config.ts");
  if (!fs.existsSync(seedConfigPath)) {
    return false;
  }
  const dataModel = path.join(root, ".snaplet", "dataModel.json");
  if (!fs.existsSync(dataModel)) {
    return false;
  }
  return true;
}

async function main() {
  try {
    const root = findPackageRoot(process.cwd(), 10);
    if (root && haveValidSeedProject(root)) {
      await run("npx", ["@snaplet/seed", "generate"], root);
    }
  } catch (e) {
    console.error("An error occurred while running postinstall script", e);
  }
  return 0;
}

void main();
