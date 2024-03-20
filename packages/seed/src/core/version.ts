import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export let version: string | undefined;

export const writePkg = (data: Record<string, unknown>) => {
  const content = JSON.stringify(data, null, 2);
  writeFileSync(join(__dirname, "..", "..", "package.json"), content);
};

export const readPkg = <Result>() => {
  const content = readFileSync(join(__dirname, "..", "..", "package.json"));
  return JSON.parse(content.toString("utf-8")) as Result;
};

export const getVersion = () =>
  (version ??= readPkg<{ version: string }>().version);
