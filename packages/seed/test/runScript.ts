import c from "ansi-colors";
import { execa } from "execa";
import tmp from 'tmp-promise'
import { remove, writeFile } from "fs-extra";
import path from "node:path";
import { testDebug } from "./debug.js";
import { expect } from 'vitest';

const ROOT_DIR = path.resolve(__dirname, "..");

const debugScriptRun = testDebug.extend("runSnapletCli");
const debugScriptOutput = debugScriptRun.extend("output");

interface RunScriptOptions {
  cwd?: string
  generateOutputPath?: string
  env?: Record<string, string>;
}

let scriptId = 0

export const runScript = async (
  script: string,
  { generateOutputPath, cwd, env = {} }: RunScriptOptions = {},
) => {
  cwd ??= (await tmp.dir()).path
  generateOutputPath ??= './seed'

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
    `${scriptName}.mts`,
  );

  const pkgPath = path.join(
    cwd,
    'package.json',
  );

  await writeFile(pkgPath, JSON.stringify({
    name: scriptName,
    type: "module",
    imports: {
      '#seed': path.join(generateOutputPath, 'index.js'), 
    }
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
