import { basename, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const SNAPLET_API_URL =
  process.env["SNAPLET_API_URL"] ?? "https://api.snaplet.dev/cli";

export const SNAPLET_APP_URL =
  process.env["SNAPLET_APP_URL"] ?? "https://app.snaplet.dev";

// context(justinvdm, 19 Mar 2024): We need a way to determine whether
// we are in dev (our dev, not user dev). We build using tsc, so
// we can't use env var replacement like we would do with esbuild or webpack.
// So instead we check whether we are using src (dev - this would be the case
// for our test runs) or dist (production)
export const IS_PRODUCTION = basename(dirname(__dirname)) !== "src";
