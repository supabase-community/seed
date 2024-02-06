import { findUp, pathExists } from "find-up";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

interface ProjectConfig {
  targetDatabaseUrl?: string;
}

export async function getProjectConfig() {
  let projectConfig: ProjectConfig = {};

  const dotSnapletPath = await findUp(".snaplet");

  if (dotSnapletPath) {
    const projectConfigPath = join(dotSnapletPath, "config.json");
    if (await pathExists(projectConfigPath)) {
      projectConfig = JSON.parse(
        await readFile(projectConfigPath, "utf8"),
      ) as ProjectConfig;
    }
  }

  return {
    targetDatabaseUrl:
      process.env["SNAPLET_TARGET_DATABASE_URL"] ??
      projectConfig.targetDatabaseUrl,
  };
}
