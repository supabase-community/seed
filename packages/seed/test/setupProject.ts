import dedent from "dedent";
import { mkdirp, pathExists, symlink, writeFile } from "fs-extra";
import path from "node:path";
import tmp from "tmp-promise";
import { type DatabaseClient } from "#core/databaseClient.js";
import { type Adapter } from "./adapters.js";
import { ROOT_DIR, TMP_DIR } from "./constants.js";
import { runCLI } from "./runCli.js";
import { runSeedScript as baseRunSeedScript } from "./runSeedScript.js";

async function seedSetup(props: {
  adapter: Adapter;
  connectionString: string;
  cwd?: string;
  env?: Record<string, string>;
  seedConfig?: ((connectionString: string) => string) | null | string;
  seedScript?: string;
}) {
  await mkdirp(TMP_DIR);

  const cwd = (props.cwd ??= (
    await tmp.dir({
      tmpdir: TMP_DIR,
    })
  ).path);

  const tsConfigPath = path.join(cwd, "tsconfig.json");
  const pkgPath = path.join(cwd, "package.json");
  const snapletSeedDestPath = path.join(
    cwd,
    "node_modules",
    "@snaplet",
    "seed",
  );

  await mkdirp(path.dirname(snapletSeedDestPath));

  if (!(await pathExists(snapletSeedDestPath))) {
    await symlink(ROOT_DIR, snapletSeedDestPath);
  }

  await writeFile(
    tsConfigPath,
    JSON.stringify(
      {
        extends: "@snaplet/tsconfig",
        compilerOptions: {
          noEmit: true,
          emitDeclarationOnly: false,
          allowImportingTsExtensions: true,
        },
        include: ["*.ts", "*.mts"],
      },
      null,
      2,
    ),
  );

  await writeFile(
    pkgPath,
    JSON.stringify(
      {
        name: path.basename(cwd),
        type: "module",
        imports: {
          "#seed": "./__seed/index.js",
        },
      },
      null,
      2,
    ),
  );

  if (props.seedConfig !== null) {
    let seedConfig: string;
    if (props.seedConfig !== undefined) {
      if (typeof props.seedConfig === "function") {
        seedConfig = props.seedConfig(props.connectionString);
      } else {
        seedConfig = props.seedConfig;
      }
    } else {
      seedConfig = props.adapter.generateSeedConfig(props.connectionString);
    }
    seedConfig = dedent`
      /// <reference path="./__seed/defineConfig.d.ts" />

      ${seedConfig}
    `;
    await writeFile(path.join(cwd, "seed.config.ts"), seedConfig);
  }

  await runCLI(["introspect"], {
    cwd,
    env: props.env,
  });

  await runCLI(["generate", "--output", "./__seed"], {
    cwd,
    env: props.env,
  });

  const runSeedScript = async (
    script: string,
    options?: { env?: Record<string, string> },
  ) => {
    const runScriptResult = await baseRunSeedScript({
      script,
      adapter: props.adapter,
      cwd,
      connectionString: props.connectionString,
      env: options?.env,
    });

    return runScriptResult;
  };

  let stdout = "";

  if (props.seedScript) {
    const runScriptResult = await runSeedScript(props.seedScript);
    stdout = runScriptResult.stdout;
  }
  return {
    cwd,
    stdout,
    runSeedScript,
    connectionString: props.connectionString,
  };
}

export async function setupProject(props: {
  adapter: Adapter;
  connectionString?: string;
  cwd?: string;
  databaseSchema?: string;
  env?: Record<string, string>;
  seedConfig?: ((connectionString: string) => string) | null | string;
  seedScript?: string;
}) {
  const { adapter } = props;
  if (props.connectionString) {
    const result = await seedSetup({
      ...props,
      connectionString: props.connectionString,
    });
    return {
      ...result,
      // If we provide the connection string of an existing database we don't create a new one and therefore we won't have a db client
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      db: undefined as any as DatabaseClient<any>,
    };
  } else {
    const { client, connectionString } = await adapter.createTestDb(
      props.databaseSchema ?? "",
    );

    const result = await seedSetup({
      ...props,
      connectionString,
    });
    return {
      db: client,
      ...result,
    };
  }
}
