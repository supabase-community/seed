import * as z from "zod";

export const enhanceConfigSchema = z.record(
  z.string(),
  z.record(
    z.string(),
    z.object({
      prompt: z.union([
        z.string(),
        z.object({
          description: z.string(),
        }),
      ]),
    }),
  ),
);
