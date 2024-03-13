import { pathExists } from "find-up";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as z from "zod";
import { ensureDotSnapletPath, getDotSnapletPath } from "./dotSnaplet.js";

const projectConfigSchema = z.object({
  projectId: z.string().optional(),
  targetDatabaseUrl: z.string().optional(),
});

export type ProjectConfig = z.infer<typeof projectConfigSchema>;

export async function getProjectConfig(props?: {
  shouldOverrideWithEnv?: boolean;
}) {
  let projectConfig: ProjectConfig = {};

  const dotSnapletPath = await getDotSnapletPath();

  if (dotSnapletPath) {
    const projectConfigPath = join(dotSnapletPath, "config.json");
    if (await pathExists(projectConfigPath)) {
      projectConfig = projectConfigSchema
        .passthrough()
        .parse(JSON.parse(await readFile(projectConfigPath, "utf8")));
    }
  }

  const shouldOverrideWithEnv = props?.shouldOverrideWithEnv ?? true;

  return {
    ...projectConfig,
    projectId: shouldOverrideWithEnv
      ? process.env["SNAPLET_PROJECT_ID"] ?? projectConfig.projectId
      : projectConfig.projectId,
    targetDatabaseUrl: shouldOverrideWithEnv
      ? process.env["SNAPLET_TARGET_DATABASE_URL"] ??
        projectConfig.targetDatabaseUrl
      : projectConfig.targetDatabaseUrl,
  };
}

export async function setProjectConfig(projectConfig: ProjectConfig) {
  const dotSnapletPath = await ensureDotSnapletPath();

  const projectConfigPath = join(dotSnapletPath, "config.json");

  await writeFile(
    projectConfigPath,
    JSON.stringify(projectConfig, null, 2),
    "utf8",
  );
}

export async function updateProjectConfig(
  projectConfig: Partial<ProjectConfig>,
) {
  const currentProjectConfig = await getProjectConfig({
    shouldOverrideWithEnv: false,
  });

  await setProjectConfig({
    ...currentProjectConfig,
    ...projectConfig,
  });
}
