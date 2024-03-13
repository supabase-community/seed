import { pathExists } from "find-up";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
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

export async function getSystemConfig(props?: {
  shouldOverrideWithEnv?: boolean;
}) {
  let systemConfig: SystemConfig = {};

  const systemConfigPath = getSystemConfigPath();

  if (await pathExists(systemConfigPath)) {
    systemConfig = systemConfigSchema
      .passthrough()
      .parse(JSON.parse(await readFile(systemConfigPath, "utf8")));
  }

  const shouldOverrideWithEnv = props?.shouldOverrideWithEnv ?? true;

  return {
    ...systemConfig,
    accessToken: shouldOverrideWithEnv
      ? process.env["SNAPLET_ACCESS_TOKEN"] ?? systemConfig.accessToken
      : systemConfig.accessToken,
  };
}

export async function setSystemConfig(systemConfig: SystemConfig) {
  const systemConfigPath = getSystemConfigPath();

  if (!(await pathExists(systemConfigPath))) {
    await mkdir(dirname(systemConfigPath), { recursive: true });
  }

  await writeFile(
    systemConfigPath,
    JSON.stringify(systemConfig, null, 2),
    "utf8",
  );
}
