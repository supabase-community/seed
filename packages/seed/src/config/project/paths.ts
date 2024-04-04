import path from "node:path";
import { getDotSnapletPath } from "#config/dotSnaplet.js";

export function getDefaultProjectConfigPath() {
  return path.join(
    process.env["SNAPLET_CWD"] ?? process.cwd(),
    ".snaplet/config.json",
  );
}

export async function getProjectConfigPath(projectBase?: string) {
  let base = projectBase ?? (await getDotSnapletPath());
  if (process.env["SNAPLET_CONFIG"]) {
    return process.env["SNAPLET_CONFIG"];
  } else if (base) {
    return path.join(base, "config.json");
  } else {
    return null;
  }
}
