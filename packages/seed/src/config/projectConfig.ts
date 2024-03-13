import { pathExists } from "find-up";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import * as z from "zod";
import { getDotSnapletPath } from "./dotSnaplet.js";

const projectConfigSchema = z.object({
  projectId: z.string().optional(),
  targetDatabaseUrl: z.string().optional(),
  sourceDatabaseUrl: z.string().optional(),
});

export type ProjectConfig = z.infer<typeof projectConfigSchema>;

export async function getProjectConfig() {
  let projectConfig: ProjectConfig = {};

  const dotSnapletPath = await getDotSnapletPath();

  if (dotSnapletPath) {
    const projectConfigPath = join(dotSnapletPath, "config.json");
    if (await pathExists(projectConfigPath)) {
      projectConfig = projectConfigSchema.parse(
        JSON.parse(await readFile(projectConfigPath, "utf8")),
      );
    }
  }

  return {
    projectId: process.env["SNAPLET_PROJECT_ID"] ?? projectConfig.projectId,
    targetDatabaseUrl:
      process.env["SNAPLET_TARGET_DATABASE_URL"] ??
      projectConfig.targetDatabaseUrl,
    sourceDatabaseUrl:
      process.env["SNAPLET_SOURCE_DATABASE_URL"] ??
      projectConfig.sourceDatabaseUrl,
  };
}
