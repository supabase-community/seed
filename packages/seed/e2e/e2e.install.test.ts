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
import { dir } from "tmp-promise";
import { beforeAll, expect, test } from "vitest";
import { getVersion } from "#core/version.js";
import { TMP_DIR } from "#test/constants.js";
import { createTestDb } from "#test/postgres/postgres/createTestDatabase.js";

const packageManagers: Record<
  string,
  {
    add: Array<string>;
    extraFiles?: Record<string, string>;
    install: Array<string>;
    versions: Array<string>;
  }
> = {
  npm: {
    install: ["install"],
    add: ["install"],
    versions: ["10.5.1"],
  },
  pnpm: {
    install: ["install"],
    add: ["add"],
    extraFiles: {
      "pnpm-workspace.yaml": "",
    },
    versions: ["8.15.6"],
  },
  yarn: {
    install: ["install", "--no-immutable"],
    add: ["add"],
    extraFiles: {
      ".yarnrc.yml": "nodeLinker: node-modules",
      "yarn.lock": "",
    },
    versions: ["4.1.1"],
  },
};

const pack = `snaplet-seed-${getVersion()}.tgz`;

beforeAll(async () => {
  await execa("pnpm", ["build"]);
}, 30_000);

for (const [
  packageManager,
  { add, extraFiles, install, versions },
] of Object.entries(packageManagers)) {
  for (const version of versions) {
    test.concurrent(`install with ${packageManager}@${version}`, async () => {
      // create the tmp directory
      await mkdir(TMP_DIR, { recursive: true });
      const tmpDir = await dir({
        tmpdir: TMP_DIR,
      });
      const cwd = tmpDir.path;

      // create the extra files specific to the package manager
      if (extraFiles) {
        for (const [filename, content] of Object.entries(extraFiles)) {
          await writeFile(join(cwd, filename), content);
        }
      }

      // copy the package to the tmp directory
      await execa("pnpm", ["pack", "--pack-destination", cwd]);
      await rename(join(cwd, pack), join(cwd, "snaplet-seed.tgz"));

      // copy all fixtures to the tmp directory
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

      // create the test database and patch the seed.config.ts file with the database URL
      const { client, connectionString } = await createTestDb();
      await client.execute("create table test_table (name char);");
      const seedConfig = await readFile(join(cwd, "seed.config.ts"), "utf-8");
      await writeFile(
        join(cwd, "seed.config.ts"),
        seedConfig.replace("<DATABASE_URL>", connectionString),
      );

      // patch the package.json file with the package manager and its version
      const packageJson = JSON.parse(
        await readFile(join(cwd, "package.json"), "utf-8"),
      ) as { packageManager: string } & Record<string, string>;
      packageJson.packageManager = `${packageManager}@${version}`;
      await writeFile(
        join(cwd, "package.json"),
        JSON.stringify(packageJson, null, 2),
      );

      await execa(packageManager, [...install], { cwd });
      await expect(
        execa("npx", ["tsx", "seed.ts"], { cwd }),
      ).resolves.not.toThrow();
      await execa(packageManager, [...add, "isodd-iseven"], { cwd });
      await expect(
        execa("npx", ["tsx", "seed.ts"], { cwd }),
      ).resolves.not.toThrow();
    });
  }
}
