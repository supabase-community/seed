import { loadConfig } from "c12";
import { existsSync } from "node:fs";
import { rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import * as z from "zod";
import { introspectProject } from "#config/utils.js";
import { aliasConfigSchema } from "./aliasConfig.js";
import { databaseClientConfigSchema } from "./databaseClientConfig.js";
import { fingerprintConfigSchema } from "./fingerprintConfig.js";
import { selectConfigSchema } from "./selectConfig.js";

// We place the "seed" config at the root of the config object
const configSchema = z.object({
  alias: aliasConfigSchema.optional(),
  databaseClient: databaseClientConfigSchema,
  fingerprint: fingerprintConfigSchema.optional(),
  select: selectConfigSchema.optional(),
  // TODO: add "introspect" config here to enable virtual constraints user defined setup
});

export type SeedConfig = z.infer<typeof configSchema>;

export async function getSeedConfig() {
  const { config } = await loadConfig({
    name: "seed",
    cwd: (await introspectProject()).rootPath,
  });

  const parsedConfig = configSchema.passthrough().parse(config ?? {});

  return parsedConfig;
}

export async function getSeedConfigPath() {
  return join((await introspectProject()).rootPath, "seed.config.ts");
}

export async function seedConfigExists() {
  return existsSync(await getSeedConfigPath());
}

export async function setSeedConfig(template: string) {
  await writeFile(await getSeedConfigPath(), template, "utf8");
}

export async function deleteSeedConfig() {
  await rm(await getSeedConfigPath());
}
