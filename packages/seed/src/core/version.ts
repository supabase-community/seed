import { readJson } from "fs-extra/esm";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let version: string | undefined;

const readPkg = <Result>(): Promise<Result> =>
  readJson(join(__dirname, "..", "..", "package.json")) as Promise<Result>;

export const getVersion = async () =>
  (version ??= (await readPkg<{ version: string }>()).version);
