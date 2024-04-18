import { z } from "zod";

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
      z.object({
        description: z.string().optional(),
        examples: z.array(z.string()).optional(),
        itemCount: z.number().optional(),
      }),
    ]),
  ),
);

export type FingerprintConfig = z.infer<typeof fingerprintConfigSchema>;
