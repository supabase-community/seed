import { pathExists } from "find-up";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import * as z from "zod";

const systemConfigSchema = z.object({
  accessToken: z.string().optional(),
  anonymousId: z.string().optional(),
  userId: z.string().optional(),
});

export type SystemConfig = z.infer<typeof systemConfigSchema>;

let cachedSystemConfig: SystemConfig | null = null;

export function getSystemPath(baseDir: string = homedir()) {
  return join(baseDir, ".config", "snaplet");
}

export function getSystemConfigPath(baseName = "system") {
  return join(getSystemPath(), `${baseName}.json`);
}

const readSystemConfig = async (forceRead = false) => {
  if (!forceRead && cachedSystemConfig != null) {
    return cachedSystemConfig;
  }

  try {
    const systemConfigPath = getSystemConfigPath();

    if (await pathExists(systemConfigPath)) {
      return (cachedSystemConfig = systemConfigSchema
        .passthrough()
        .parse(JSON.parse(await readFile(systemConfigPath, "utf8"))));
    } else {
      return {};
    }
  } catch (e) {
    cachedSystemConfig = null;
    throw e;
  }
};

export async function getSystemConfig(
  props: {
    forceRead?: boolean;
    shouldOverrideWithEnv?: boolean;
  } = {},
) {
  const { forceRead, shouldOverrideWithEnv = true } = props;
  const systemConfig: SystemConfig = await readSystemConfig(forceRead);

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

  cachedSystemConfig = null;
}

export async function updateSystemConfig(systemConfig: Partial<SystemConfig>) {
  const currentSystemConfig = await getSystemConfig({
    shouldOverrideWithEnv: false,
  });

  const nextSystemConfig = {
    ...currentSystemConfig,
    ...systemConfig,
  };

  await setSystemConfig(nextSystemConfig);
}
