import { execa } from "execa";
import { findUp } from "find-up";
import { readFile } from "node:fs/promises";
import { dirname } from "node:path";

interface PackageManager {
  add: (
    packages: Array<string>,
    options?: { cwd?: string; dev?: boolean },
  ) => Promise<void>;
  id: string;
  lockfile: string;
}

const bun = {
  id: "bun" as const,
  lockfile: "bun.lockb",
  async add(packages, options) {
    await execa("bun", ["add", ...(options?.dev ? ["-D"] : []), ...packages], {
      cwd: options?.cwd,
    });
  },
} satisfies PackageManager;

const npm = {
  id: "npm" as const,
  lockfile: "package-lock.json",
  async add(packages, options) {
    await execa(
      "npm",
      ["install", ...(options?.dev ? ["-D"] : []), ...packages],
      {
        cwd: options?.cwd,
      },
    );
  },
} satisfies PackageManager;

const pnpm = {
  id: "pnpm" as const,
  lockfile: "pnpm-lock.yaml",
  async add(packages, options) {
    await execa(
      "pnpm",
      [
        "add",
        ...(options?.dev ? ["-D"] : []),
        "--ignore-workspace-root-check",
        ...packages,
      ],
      {
        cwd: options?.cwd,
      },
    );
  },
} satisfies PackageManager;

const yarn = {
  id: "yarn" as const,
  lockfile: "yarn.lock",
  async add(packages, options) {
    await execa("yarn", ["add", ...(options?.dev ? ["-D"] : []), ...packages], {
      cwd: options?.cwd,
    });
  },
} satisfies PackageManager;

const packageManagers = {
  [bun.id]: bun,
  [npm.id]: npm,
  [pnpm.id]: pnpm,
  [yarn.id]: yarn,
};

export async function getPackageJsonPath() {
  const packageJsonPath = await findUp("package.json");
  if (!packageJsonPath) {
    throw new Error("No package.json found");
  }
  return packageJsonPath;
}

export async function getRootPath() {
  // First we try to find the closest seed.config.ts file
  const seedConfigPath = await findUp("seed.config.ts");
  // If we found a seed.config.ts file we use its directory as root
  // (used when --config option is passed to sync/init commands)
  if (seedConfigPath) {
    return dirname(seedConfigPath);
  }
  // Otherwise we use the directory of the closest package.json as root
  const packageJsonPath = await getPackageJsonPath();
  return dirname(packageJsonPath);
}

export async function getInstalledDependencies() {
  const packageJsonPath = await getPackageJsonPath();
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  return {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };
}

export async function getPackageManager() {
  // lock file strategy
  for (const pm of Object.values(packageManagers)) {
    const lockfilePath = await findUp(pm.lockfile);
    if (lockfilePath) {
      return pm;
    }
  }

  const packageJsonPath = await getPackageJsonPath();

  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as {
    packageManager?: string;
  };

  if (packageJson.packageManager?.startsWith("pnpm")) {
    return packageManagers.pnpm;
  } else if (packageJson.packageManager?.startsWith("yarn")) {
    return packageManagers.yarn;
  }

  // we assume npm if nothing is found
  return packageManagers.npm;
}
