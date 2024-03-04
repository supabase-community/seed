import { pathExists } from "find-up";
import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";
import * as z from "zod";

const systemConfigSchema = z.object({
  accessToken: z.string().optional(),
});

export type SystemConfig = z.infer<typeof systemConfigSchema>;

export function getSystemPath(baseDir: string = homedir()) {
  return join(baseDir, ".config", "snaplet");
}

export function getSystemConfigPath(baseName = "system") {
  return join(getSystemPath(), `${baseName}.json`);
}

export async function getSystemConfig() {
  let systemConfig: SystemConfig = {};

  const systemConfigPath = getSystemConfigPath();

  if (await pathExists(systemConfigPath)) {
    systemConfig = systemConfigSchema.parse(
      JSON.parse(await readFile(systemConfigPath, "utf8")),
    );
  }

  return {
    accessToken:
      process.env["SNAPLET_ACCESS_TOKEN"] ?? systemConfig.accessToken,
  };
}
