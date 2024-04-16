import * as z from "zod";

export const enhanceConfigSchema = z.record(
  z.string(),
  z.record(
    z.string(),
    z.object({
      prompt: z.object({
        description: z.string(),
      }),
    }),
  ),
);
