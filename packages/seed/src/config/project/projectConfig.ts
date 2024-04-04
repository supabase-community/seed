import { select } from "@inquirer/prompts";
import fs from "fs-extra";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import {
  getDefaultProjectConfigPath,
  getProjectConfigPath,
} from "#config/project/paths.js";
import { trpc } from "#trpc/client.js";

const projectConfigSchema = z.object({
  projectId: z.string().optional(),
});

type ProjectConfig = z.infer<typeof projectConfigSchema>;

export const selectProject = async () => {
  const projects = await trpc.project.list.query();
  let selectedProject = projects[0];
  if (projects.length > 1) {
    const projectNames = projects.map((p) => p.name);
    const projectName = await select({
      message: "Select project",
      choices: projectNames.map((p) => ({ title: p, value: p })),
    });
    const project = projects.find((p) => p.name === projectName);
    if (project) {
      selectedProject = project;
    }
  }
  return selectedProject.id;
};

export const getProjectConfig = async (configPath?: string) => {
  const cPath =
    configPath ??
    (await getProjectConfigPath()) ??
    getDefaultProjectConfigPath();

  if (!fs.existsSync(cPath)) {
    return null;
  }
  return projectConfigSchema
    .passthrough()
    .parse(JSON.parse(await readFile(cPath, "utf8")));
};

export const saveProjectConfig = async ({
  config,
  configPath,
}: {
  config: ProjectConfig;
  configPath?: string;
}) => {
  const cPath =
    configPath ??
    (await getProjectConfigPath()) ??
    getDefaultProjectConfigPath();
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
