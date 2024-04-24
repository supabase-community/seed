import fs from "fs-extra";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import { type AdapterId, adapters } from "#adapters/index.js";
import { getProjectConfigPath } from "#config/project/paths.js";

const projectConfigSchema = z.object({
  projectId: z.string().optional(),
  adapter: z
    .string()
    .refine((v) => Object.keys(adapters).includes(v)) as z.ZodType<AdapterId>,
});

type ProjectConfig = z.infer<typeof projectConfigSchema>;

export const getProjectConfig = async (
  // this should only be used in tests in production we should use the default path always
  configPath?: string,
) => {
  const cPath = configPath ?? (await getProjectConfigPath());

  if (!fs.existsSync(cPath)) {
    return null;
  }
  return projectConfigSchema
    .passthrough()
    .parse(JSON.parse(await readFile(cPath, "utf8")));
};

export const projectConfigExists = async () => {
  const path = await getProjectConfigPath();
  return path && fs.existsSync(path);
};

export const saveProjectConfig = async ({
  config,
  configPath,
}: {
  config: Partial<ProjectConfig>;
  // this should only be used in tests in production we should use the default path always
  configPath?: string;
}) => {
  const cPath = configPath ?? (await getProjectConfigPath());
  fs.mkdirSync(path.dirname(cPath), { recursive: true });

  const cachedConfig = await getProjectConfig(cPath);
  if (cachedConfig) {
    const newConfig = { ...cachedConfig, ...config };
    fs.writeFileSync(cPath, JSON.stringify(newConfig, undefined, 2));
  } else {
    fs.writeFileSync(cPath, JSON.stringify(config, undefined, 2));
  }

  return cPath;
};
