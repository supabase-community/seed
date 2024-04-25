import { pathExists } from "fs-extra";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { type AdapterId, adapters } from "#adapters/index.js";
import { ensureDotSnapletPath, getDotSnapletPath } from "#config/dotSnaplet.js";
import { jsonStringify } from "#core/utils.js";

const projectConfigSchema = z.object({
  projectId: z.string().optional(),
  adapter: z
    .string()
    .refine((v) => Object.keys(adapters).includes(v))
    .optional() as z.ZodType<AdapterId | undefined>,
});

type ProjectConfig = z.infer<typeof projectConfigSchema>;

export async function getProjectConfigPath() {
  return path.join(await getDotSnapletPath(), "config.json");
}

export async function getProjectConfig() {
  const projectConfigPath = await getProjectConfigPath();

  if (await pathExists(projectConfigPath)) {
    return projectConfigSchema
      .passthrough()
      .parse(JSON.parse(await readFile(projectConfigPath, "utf8")));
  } else {
    return {} as ProjectConfig;
  }
}

async function setProjectConfig(projectConfig: ProjectConfig) {
  await ensureDotSnapletPath();

  const projectConfigPath = await getProjectConfigPath();

  await writeFile(
    projectConfigPath,
    jsonStringify(projectConfig, undefined, 2),
    "utf8",
  );
}

export async function updateProjectConfig(
  projectConfig: Partial<ProjectConfig>,
) {
  const currentProjectConfig = await getProjectConfig();

  const nextProjectConfig = {
    ...currentProjectConfig,
    ...projectConfig,
  };

  await setProjectConfig(nextProjectConfig);
}

export async function projectConfigExists() {
  return existsSync(await getProjectConfigPath());
}
