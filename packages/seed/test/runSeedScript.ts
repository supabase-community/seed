import c from "ansi-colors";
import { execa } from "execa";
import { mkdirp, remove, symlink, writeFile } from "fs-extra";
import path from "node:path";
import tmp from "tmp-promise";
import { expect } from "vitest";
import { type Adapter } from "./adapters.js";
import { ROOT_DIR } from "./constants.js";
import { testDebug } from "./debug.js";

const debugScriptRun = testDebug.extend("runSeedScript");
const debugScriptOutput = debugScriptRun.extend("output");

interface RunScriptProps {
  adapter: Adapter;
  connectionString: string;
  cwd?: string;
  env?: Record<string, string>;
  generateOutputPath?: string;
  script: string;
}

let scriptId = 0;

export const runSeedScript = async ({
  script,
  adapter,
  generateOutputPath,
  connectionString,
  cwd,
  env = {},
}: RunScriptProps) => {
  cwd ??= (await tmp.dir()).path;
  generateOutputPath ??= "./__generateOutput";

  debugScriptRun(
    [
      "",
      "==================================",
      c.bold("Running script:"),
      `${c.bold("test:")} ${expect.getState().currentTestName}`,
      `${c.bold("script:")} ${script}`,
      "==================================",
      "",
    ].join("\n"),
  );

  const scriptName = `script${++scriptId}`;

  const scriptPath = path.join(cwd, `${scriptName}.ts`);
  const clientWrapperRelativePath = "./__seed.js";
  const clientWrapperPath = path.join(cwd, clientWrapperRelativePath);
  const pkgPath = path.join(cwd, "package.json");
  const snapletScopeDestPath = path.join(cwd, "node_modules", "@snaplet");
  const seedDestPath = path.join(snapletScopeDestPath, "seed");
  const copycatDestPath = path.join(snapletScopeDestPath, "copycat");
  const copycatSrcPath = path.join(
    ROOT_DIR,
    "node_modules",
    "@snaplet",
    "copycat",
  );

  await mkdirp(snapletScopeDestPath);
  await symlink(ROOT_DIR, seedDestPath);
  await symlink(copycatSrcPath, copycatDestPath);

  await writeFile(
    pkgPath,
    JSON.stringify({
      name: scriptName,
      type: "module",
      imports: {
        "#seed": clientWrapperRelativePath,
      },
    }),
  );

  await writeFile(
    clientWrapperPath,
    adapter.generateClientWrapper({
      generateOutputPath,
      connectionString,
    }),
  );

  await writeFile(scriptPath, script);

  try {
    const result = execa("tsx", [scriptPath], {
      stderr: "pipe",
      stdout: "pipe",
      env: {
        DEBUG_COLORS: "1",
        NODE_PATH: path.join(ROOT_DIR, "node_modules"),
        ...env,
      },
    });
    result.stdout?.on("data", (chunk: Buffer) => {
      debugScriptOutput(chunk.toString().trim());
    });
    result.stderr?.on("data", (chunk: Buffer) => {
      debugScriptOutput(chunk.toString().trim());
    });

    return await result;
  } catch (e) {
    throw e;
  } finally {
    await remove(scriptPath);
    await remove(pkgPath);
  }
};
