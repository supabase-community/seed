import { type Adapter } from "./adapters.js";
import tmp from 'tmp-promise'
import path from "node:path";
import { runSeedScript as baseRunSeedScript } from './runSeedScript.js';
import { runCLI } from './runCli.js';
import { writeFile } from "fs-extra";

export async function setupProject(props: {
  adapter: Adapter;
  connectionString?: string;
  databaseSchema?: string;
  env?: Record<string, string>;
  cwd?: string
  seedScript?: string;
  snapletConfig?: null | string;
}) {
  const { adapter } = props

  const { client, name: connectionString } = await adapter.createTestDb(
    props.databaseSchema ?? "",
  );

  const db = adapter.createClient(client)

  const cwd = props.cwd ??= (await tmp.dir()).path

  if (props.snapletConfig) {
    await writeFile(path.join(cwd, 'seed.config.ts'), props.snapletConfig);
  }

  const generateOutputPath = './seed';

  await runCLI(["generate", "--output", generateOutputPath], {
    cwd,
    env: props.env,
  });

  const runSeedScript = async (
    script: string,
    options?: { env?: Record<string, string> }
  ) => {
    const runScriptResult = await baseRunSeedScript({
      script,
      adapter,
      cwd,
      connectionString,
      generateOutputPath,
      env: options?.env,
    })

    return runScriptResult
  }

  let stdout = ''
  if (props.seedScript) {
    const runScriptResult = await runSeedScript(props.seedScript)
    stdout = runScriptResult.stdout
  }

  return {
    connectionString,
    db,
    cwd,
    stdout,
    runSeedScript
  };
}
