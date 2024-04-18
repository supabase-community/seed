import path from "node:path";
import { getDotSnapletPath } from "#config/dotSnaplet.js";

export async function getProjectConfigPath(
  // This parameter is only used in tests to override the default path
  // and should not be used in production code.
  projectBase?: string,
) {
  let base = projectBase ?? (await getDotSnapletPath());
  if (process.env["SNAPLET_CONFIG"]) {
    return process.env["SNAPLET_CONFIG"];
  }
  return path.join(base, "config.json");
}
