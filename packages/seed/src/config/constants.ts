import { basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const SNAPLET_API_URL =
  process.env["SNAPLET_API_URL"] ?? "https://api.snaplet.dev/cli";

export const SNAPLET_APP_URL =
  process.env["SNAPLET_APP_URL"] ?? "https://app.snaplet.dev";

export const IS_PRODUCTION = basename(dirname(__dirname)) !== "src";
