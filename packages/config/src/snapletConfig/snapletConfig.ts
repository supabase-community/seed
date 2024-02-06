import { loadConfig } from "c12";
import * as z from "zod";
import { introspectConfigSchema } from "./introspectConfig.js";
import { seedConfigSchema } from "./seedConfig.js";
import { selectConfigSchema } from "./selectConfig.js";

const snapletConfigSchema = z.object({
  select: selectConfigSchema.optional(),
  introspect: introspectConfigSchema.optional(),
  seed: seedConfigSchema.optional(),
});

export type SnapletConfig = z.infer<typeof snapletConfigSchema>;

export async function getSnapletConfig() {
  const { config } = await loadConfig({
    name: "snaplet",
  });

  const parsedConfig = snapletConfigSchema.parse(config);

  return parsedConfig;
}
