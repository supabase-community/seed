import { execa } from "execa";
import { findUp } from "find-up";
import { readFile } from "node:fs/promises";
import { dirname } from "node:path";

interface PackageManager {
  add: (packages: Array<string>, options: { dev: boolean }) => Promise<void>;
  id: string;
  lockfile: string;
}

const bun = {
  id: "bun" as const,
  lockfile: "bun.lockb",
  async add(packages: Array<string>, options: { dev: boolean }) {
    await execa("bun", ["add", ...(options.dev ? ["-D"] : []), ...packages]);
  },
} satisfies PackageManager;

const npm = {
  id: "npm" as const,
  lockfile: "package-lock.json",
  async add(packages: Array<string>, options: { dev: boolean }) {
    await execa("npm", [
      "install",
      ...(options.dev ? ["-D"] : []),
      ...packages,
    ]);
  },
} satisfies PackageManager;

const pnpm = {
  id: "pnpm" as const,
  lockfile: "pnpm-lock.yaml",
  async add(packages: Array<string>, options: { dev: boolean }) {
    await execa("pnpm", [
      "add",
      ...(options.dev ? ["-D"] : []),
      "--ignore-workspace-root-check",
      ...packages,
    ]);
  },
} satisfies PackageManager;

const yarn = {
  id: "yarn" as const,
  lockfile: "yarn.lock",
  async add(packages: Array<string>, options: { dev: boolean }) {
    await execa("yarn", ["add", ...(options.dev ? ["-D"] : []), ...packages]);
  },
} satisfies PackageManager;

const packageManagers = {
  [bun.id]: bun,
  [npm.id]: npm,
  [pnpm.id]: pnpm,
  [yarn.id]: yarn,
};

export async function introspectProject() {
  let rootPath: string | undefined;
  let packageManager: PackageManager | undefined;

  for (const pm of Object.values(packageManagers)) {
    const lockfilePath = await findUp(pm.lockfile);
    if (lockfilePath) {
      return { rootPath: dirname(lockfilePath), packageManager: pm };
    }
  }

  const packageJsonPath = await findUp("package.json");

  if (!packageJsonPath) {
    throw new Error("No package.json found");
  }

  rootPath = dirname(packageJsonPath);
  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    packageManager?: string;
  };
  if (packageJson.packageManager?.startsWith("pnpm")) {
    packageManager = packageManagers.pnpm;
  } else if (packageJson.packageManager?.startsWith("yarn")) {
    packageManager = packageManagers.yarn;
  } else {
    packageManager = packageManagers.npm;
  }

  return { rootPath, packageManager, packageJson };
}
