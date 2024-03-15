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

export async function introspectProject() {
  let rootPath: string | undefined;
  let packageManager: PackageManager | undefined;

  // lockfile based strategy
  for (const pm of Object.values(packageManagers)) {
    const lockfilePath = await findUp(pm.lockfile);
    if (lockfilePath) {
      rootPath = dirname(lockfilePath);
      packageManager = pm;
      break;
    }
  }

  const packageJsonPath = await findUp("package.json", { cwd: rootPath });

  if (!packageJsonPath) {
    throw new Error("No package.json found");
  }

  if (!rootPath) {
    rootPath = dirname(packageJsonPath);
  }

  const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
    packageManager?: string;
  };

  if (!packageManager) {
    if (packageJson.packageManager?.startsWith("pnpm")) {
      packageManager = packageManagers.pnpm;
    } else if (packageJson.packageManager?.startsWith("yarn")) {
      packageManager = packageManagers.yarn;
    } else {
      packageManager = packageManagers.npm;
    }
  }

  return { rootPath, packageManager, packageJson };
}
