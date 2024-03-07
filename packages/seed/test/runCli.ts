import c from "ansi-colors";
import { execa } from "execa";
import path from "node:path";
import { inspect } from "node:util";
import { expect } from "vitest";
import { ROOT_DIR } from "./constants.js";
import { testDebug } from "./debug.js";

const debugCliRun = testDebug.extend("runCli");
const debugCliOutput = debugCliRun.extend("output");
// for the output we want to totally disable all prefix including namespace
debugCliOutput.namespace = "";

const SHELL = "/bin/bash";

interface RunCliOptions {
  cwd?: string;
  env?: Partial<NodeJS.ProcessEnv>;
}

export async function runCLI(args: Array<string>, options: RunCliOptions = {}) {
  const { env: envOverrides = {}, cwd } = options;
  const entrypointTS = path.resolve(ROOT_DIR, "./src/cli/index.ts");

  const { SNAPLET_ACCESS_TOKEN = "__test " } = process.env;

  const env = {
    SNAPLET_DISABLE_TELEMETRY: "1",
    NODE_ENV: "development",
    SNAPLET_API_HOSTNAME: "http://localhost:3000",
    SNAPLET_ACCESS_TOKEN,
    ...envOverrides,
  };

  debugCliRun(
    [
      "",
      "==================================",
      c.bold("Running cli:"),
      `${c.bold("args:")} ${args.join(" ")}`,
      `${c.bold("test:")} ${expect.getState().currentTestName}`,
      Object.keys(envOverrides).length
        ? `${c.bold("env overrides:")} ${inspect(envOverrides)}`
        : null,
      "==================================",
      "",
    ]
      .filter((v) => v != null)
      .join("\n"),
  );

  const result = execa("tsx", [entrypointTS, ...args], {
    shell: SHELL,
    stderr: "pipe",
    stdout: "pipe",
    cwd,
    env: {
      SNAPLET_API_URL: "http://localhost:3000",
      ...env,
      DEBUG_COLORS: "1",
    },
    ...options,
  });

  result.stdout?.on("data", (chunk: Buffer) => {
    debugCliOutput(chunk.toString().trim());
  });

  result.stderr?.on("data", (chunk: Buffer) => {
    debugCliOutput(chunk.toString().trim());
  });

  return result;
}
