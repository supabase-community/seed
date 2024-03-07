import c from "ansi-colors";
import { execa } from "execa";
import tmp from 'tmp-promise'
import { remove, writeFile } from "fs-extra";
import path from "node:path";
import { testDebug } from "./debug.js";
import { expect } from 'vitest';
import { type Adapter } from './adapters.js';

const ROOT_DIR = path.resolve(__dirname, "..");

const debugScriptRun = testDebug.extend("runSnapletCli");
const debugScriptOutput = debugScriptRun.extend("output");

interface RunScriptProps {
  script: string
  adapter: Adapter
  connectionString: string
  cwd?: string
  generateOutputPath?: string
  env?: Record<string, string>;
}

let scriptId = 0

export const runSeedScript = async (
  { script, adapter, generateOutputPath, connectionString, cwd, env = {} }: RunScriptProps
) => {
  cwd ??= (await tmp.dir()).path
  generateOutputPath ??= './__generateOutput'

  debugScriptRun(
    [
      "",
      "==================================",
      `${c.bold("Running script:")}`,
      `${c.bold("test:")} ${expect.getState().currentTestName}`,
      `${c.bold("script:")} ${script}`,
      "==================================",
      "",
    ]
      .filter((v) => v != null)
      .join("\n"),
  );

  const scriptName = `script${++scriptId}`

  const scriptPath = path.join(
    cwd,
    `${scriptName}.ts`,
  );

  const clientWrapperRelativePath = './__seed.js'

  const clientWrapperPath = path.join(
    cwd,
    clientWrapperRelativePath
  );

  const pkgPath = path.join(
    cwd,
    'package.json',
  );

  await writeFile(pkgPath, JSON.stringify({
    name: scriptName,
    type: "module",
    imports: {
      '#seed': clientWrapperRelativePath, 
    }
  }))

  await writeFile(clientWrapperPath, adapter.generateClientWrapper({
    generateOutputPath,
    connectionString
  }))

  await writeFile(scriptPath, script);

  try {
    const viteConfigPath = path.resolve(ROOT_DIR, "./vite.config.mts");

    const result = execa(
      "vite-node",
      ["-c", viteConfigPath, scriptPath],
      {
        stderr: "pipe",
        stdout: "pipe",
        env: {
          DEBUG_COLORS: "1",
          ...env,
        },
      },
    );
    result.stdout?.on("data", (chunk) =>
      debugScriptOutput(chunk.toString().trim()),
    );
    result.stderr?.on("data", (chunk) =>
      debugScriptOutput(chunk.toString().trim()),
    );

    return result;
  } catch (e) {
    throw e;
  } finally {
    await remove(scriptPath);
    await remove(pkgPath)
  }
};
