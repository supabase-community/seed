import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { jsonStringify } from "./utils.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let version: string | undefined;

export const writePkg = (data: Record<string, unknown>) => {
  const productionPath = join(__dirname, "..", "..", "..", "package.json");
  const testPath = join(__dirname, "..", "..", "package.json");
  if (existsSync(productionPath)) {
    writeFileSync(productionPath, jsonStringify(data, undefined, 2));
    return;
  }
  writeFileSync(testPath, jsonStringify(data, undefined, 2));
  return;
};

export const readPkg = <Result>() => {
  const productionPath = join(__dirname, "..", "..", "..", "package.json");
  const testPath = join(__dirname, "..", "..", "package.json");
  if (existsSync(productionPath)) {
    const content = readFileSync(productionPath);
    return JSON.parse(content.toString("utf-8")) as Result;
  }
  const content = readFileSync(testPath);
  return JSON.parse(content.toString("utf-8")) as Result;
};

export const getVersion = () =>
  (version ??= readPkg<{ version: string }>().version);
