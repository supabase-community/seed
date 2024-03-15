import { loadConfig } from "c12";
import * as z from "zod";
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
  });

  const parsedConfig = configSchema.parse(config ?? {});

  return parsedConfig;
}
