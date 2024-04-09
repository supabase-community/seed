import { execa } from "execa";
import {
  cp,
  mkdir,
  readFile,
  readdir,
  rename,
  writeFile,
} from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { type DirectoryResult, dir } from "tmp-promise";
import { beforeAll, expect, test } from "vitest";
import { getVersion } from "#core/version.js";
import { TMP_DIR } from "#test/constants.js";
import { createTestDb } from "#test/postgres/postgres/createTestDatabase.js";

const packageManagers: Record<
  string,
  {
    cleanCache?: Array<string>;
    extraFiles?: Record<string, string>;
    install: string;
    versions: Array<string>;
  }
> = {
  npm: {
    cleanCache: ["cache", "clean", "--force"],
    install: "install",
    versions: ["10.5.1"],
  },
  pnpm: {
    install: "add",
    extraFiles: {
      "pnpm-workspace.yaml": "",
    },
    versions: ["8.15.6"],
  },
  yarn: {
    cleanCache: ["cache", "clean"],
    install: "add",
    extraFiles: {
      ".yarnrc.yml": "nodeLinker: node-modules",
      "yarn.lock": "",
    },
    versions: ["4.1.1"],
  },
};

let tmpDirectories: Array<DirectoryResult> = [];

const pack = `snaplet-seed-${getVersion()}.tgz`;

beforeAll(async () => {
  await execa("pnpm", ["build"]);
});

// afterAll(async () => {
//   await Promise.allSettled(tmpDirectories.map((tmpDir) => tmpDir.cleanup()));
// });

for (const [
  packageManager,
  { cleanCache, extraFiles, install, versions },
] of Object.entries(packageManagers)) {
  for (const version of versions) {
    test.concurrent(`install with ${packageManager}@${version}`, async () => {
      await mkdir(TMP_DIR, { recursive: true });
      const tmpDir = await dir({
        tmpdir: TMP_DIR,
      });
      tmpDirectories.push(tmpDir);
      const cwd = tmpDir.path;
      if (extraFiles) {
        for (const [filename, content] of Object.entries(extraFiles)) {
          await writeFile(join(cwd, filename), content);
        }
      }
      await execa("pnpm", ["pack", "--pack-destination", cwd]);
      await rename(join(cwd, pack), join(cwd, "snaplet-seed.tgz"));
      const fixturesPath = join(
        dirname(fileURLToPath(import.meta.url)),
        "fixtures",
        "install",
      );
      for (const file of await readdir(fixturesPath, { withFileTypes: true })) {
        await cp(join(file.path, file.name), join(cwd, file.name), {
          recursive: true,
        });
      }
      const { client, connectionString } = await createTestDb();
      await client.execute("create table test_table (name char);");
      const seedConfig = await readFile(join(cwd, "seed.config.ts"), "utf-8");
      await writeFile(
        join(cwd, "seed.config.ts"),
        seedConfig.replace("<DATABASE_URL>", connectionString),
      );
      const packageJson = JSON.parse(
        await readFile(join(cwd, "package.json"), "utf-8"),
      ) as Record<string, string> & { packageManager: string };
      packageJson.packageManager = `${packageManager}@${version}`;
      await writeFile(
        join(cwd, "package.json"),
        JSON.stringify(packageJson, null, 2),
      );
      if (cleanCache) {
        await execa(packageManager, cleanCache, { cwd });
      }
      await execa(packageManager, ["install"], { cwd });
      await expect(
        execa("npx", ["tsx", "seed.mts"], { cwd }),
      ).resolves.not.toThrow();
      await execa(packageManager, [install, "lodash"], { cwd });
      await expect(
        execa("npx", ["tsx", "seed.mts"], { cwd }),
      ).resolves.not.toThrow();
    });
  }
}
