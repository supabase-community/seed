import { pathExists } from "fs-extra";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { existsSync } from "node:fs";
import { z } from "zod";
import { type AdapterId, adapters } from "#adapters/index.js";
import { getDotSnapletPath } from "#config/dotSnaplet.js";
import { jsonStringify } from "#core/utils.js";

const projectConfigSchema = z.object({
  projectId: z.string().optional(),
  adapter: z
    .string()
    .refine((v) => Object.keys(adapters).includes(v)) as z.ZodType<AdapterId>,
});

type ProjectConfig = z.infer<typeof projectConfigSchema>;

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