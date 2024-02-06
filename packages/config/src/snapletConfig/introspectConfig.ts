import * as z from "zod";

export const introspectConfigSchema = z.object({
  virtualForeignKeys: z
    .array(
      z.object({
        fkTable: z.string(),
        targetTable: z.string(),
        keys: z
          .array(
            z.object({
              fkColumn: z.string(),
              targetColumn: z.string(),
            }),
          )
          .min(1),
      }),
    )
    .optional(),
});

export type IntrospectConfig = z.infer<typeof introspectConfigSchema>;
