import { findUp, pathExists } from "find-up";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import * as z from "zod";

export const fingerprintConfigSchema = z.record(
  z.string().describe("modelName"),
  z.record(
    z.string().describe("modelField"),
    z.object({
      count: z
        .union([z.number(), z.object({ min: z.number(), max: z.number() })])
        .optional(),
      options: z.record(z.string(), z.any()).optional(),
      schema: z.record(z.string(), z.any()).describe("jsonSchema").optional(),
      prompt: z
        .union([
          z.string(),
          z.object({
            description: z.string(),
            examples: z.array(z.string()).optional(),
            itemCount: z.number().optional(),
          }),
        ])
        .optional(),
    }),
  ),
);

type FingerprintConfig = z.infer<typeof fingerprintConfigSchema>;

export async function getFingerprintConfig() {
  let fingerprintConfig: FingerprintConfig = {};

  const dotSnapletPath = await findUp(".snaplet");

  if (dotSnapletPath) {
    const fingerprintConfigPath = join(dotSnapletPath, "fingerprint.json");
    if (await pathExists(fingerprintConfigPath)) {
      fingerprintConfig = fingerprintConfigSchema.parse(
        JSON.parse(await readFile(fingerprintConfigPath, "utf8")),
      );
    }
  }

  return fingerprintConfig;
}
