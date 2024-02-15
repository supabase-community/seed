import { findUp, pathExists } from "find-up";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import * as z from "zod";

export const fingerprintConfigSchema = z.record(
  z.string().describe("modelName"),
  z.record(
    z.string().describe("modelField"),
    z.union([
      z.object({
        count: z.union([
          z.number(),
          z.object({ min: z.number(), max: z.number() }),
        ]),
      }),
      z.object({
        options: z.record(z.string(), z.any()),
      }),
      z.object({
        schema: z.record(z.string(), z.any()).describe("jsonSchema"),
      }),
    ]),
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
