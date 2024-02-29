import { loadConfig } from "c12";
import * as z from "zod";
import { seedConfigSchema } from "./seedConfig.js";
import { selectConfigSchema } from "./selectConfig.js";

// We place the "seed" config at the root of the config object
const configSchema = seedConfigSchema
  .extend(
    // Here we extend the seed config with other additional config fields
    z.object({
      // TODO: add "introspect" config here to enable virtual constraints user defined setup
      select: selectConfigSchema.optional(),
    }).shape,
  )
  .optional();

export type SeedConfig = z.infer<typeof configSchema>;

export async function getSnapletSeedConfig() {
  const { config } = await loadConfig({
    name: "seed",
  });

  const parsedConfig = configSchema.parse(config ?? {});

  return parsedConfig;
}
