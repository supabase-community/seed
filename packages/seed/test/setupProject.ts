import { mkdirp, writeFile } from "fs-extra";
import path from "node:path";
import tmp from "tmp-promise";
import { type DatabaseClient } from "#core/adapters.js";
import { type Adapter } from "./adapters.js";
import { TMP_DIR } from "./constants.js";
import { runCLI } from "./runCli.js";
import { runSeedScript as baseRunSeedScript } from "./runSeedScript.js";

async function seedSetup(props: {
  adapter: Adapter;
  connectionString: string;
  cwd?: string;
  env?: Record<string, string>;
  seedScript?: string;
  snapletConfig?: null | string;
}) {
  await mkdirp(TMP_DIR);

  const cwd = (props.cwd ??= (
    await tmp.dir({
      tmpdir: TMP_DIR,
    })
  ).path);

  if (props.snapletConfig) {
    await writeFile(path.join(cwd, "seed.config.ts"), props.snapletConfig);
  }

  const generateOutputPath = "./seed";
  const generateOutputIndexPath = "./seed/index.js";

  await runCLI(["introspect", "--database-url", props.connectionString], {
    cwd,
    env: props.env,
  });

  await runCLI(["generate", "--output", generateOutputPath], {
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
      generateOutputIndexPath,
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
  seedScript?: string;
  snapletConfig?: null | string;
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
