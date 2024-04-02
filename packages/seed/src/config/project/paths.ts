import { findUp } from "find-up";
import fs from "node:fs";
import path from "node:path";

export function getDefaultProjectConfigPath() {
  return path.join(
    process.env["SNAPLET_CWD"] ?? process.cwd(),
    ".snaplet/config.json",
  );
}

/**
 * Searches "upwards" for a `.snaplet` directory.
 *
 * Snaplet expects to be run in the same directory as your code,
 * because we pin your code against a data source via a `.snaplet/config.json` file.
 * @todo make this use `.git`
 */
export async function findProjectPath(
  cwd = process.env["SNAPLET_CWD"] ?? process.cwd(),
) {
  // It's possible that the specified SNAPLET_CWD is invalid.
  if (process.env["SNAPLET_CWD"] && !fs.existsSync(cwd)) {
    throw new Error(
      `The specified 'SNAPLET_CWD' directory '${cwd}' does not exist.`,
    );
  }
  return findUp(".snaplet", { cwd, type: "directory" });
}

export async function getProjectConfigPath(projectBase?: string) {
  let base = projectBase ?? (await findProjectPath());
  if (process.env["SNAPLET_CONFIG"]) {
    return process.env["SNAPLET_CONFIG"];
  } else if (base) {
    return path.join(base, "config.json");
  } else {
    return null;
  }
}
