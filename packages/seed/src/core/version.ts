import { readJSONSync } from "fs-extra/esm";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export let version: string | undefined;

const readPkg = <Result>() =>
  readJSONSync(join(__dirname, "..", "..", "package.json")) as Result;

export const getVersion = () =>
  (version ??= readPkg<{ version: string }>().version);
