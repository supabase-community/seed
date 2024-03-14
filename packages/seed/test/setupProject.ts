import { mkdirp, writeFile } from "fs-extra";
import path from "node:path";
import tmp from "tmp-promise";
import { type Adapter } from "./adapters.js";
import { TMP_DIR } from "./constants.js";
import { runCLI } from "./runCli.js";
import { runSeedScript as baseRunSeedScript } from "./runSeedScript.js";

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

  const { client, connectionString } = await adapter.createTestDb(
    props.databaseSchema ?? "",
  );

  const db = adapter.createClient(client);

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

  await runCLI(["introspect", "--database-url", connectionString], {
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
      adapter,
      cwd,
      connectionString,
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
    connectionString,
    db,
    cwd,
    stdout,
    runSeedScript,
  };
}
