import { loadConfig } from "c12";
import * as z from "zod";
import { seedConfigSchema } from "./seedConfig.js";
import { selectConfigSchema } from "./selectConfig.js";

const configSchema = seedConfigSchema
  .extend(
    z.object({
      select: selectConfigSchema.optional(),
    }).shape,
  )
  .optional();

export type SeedConfig = z.infer<typeof configSchema>;

export async function getSnapletConfig() {
  const { config } = await loadConfig({
    name: "seed",
  });

  const parsedConfig = configSchema.parse(config ?? {});

  return parsedConfig;
}
