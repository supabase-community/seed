import * as z from "zod";

const selectConfigDefaultSchema = z.union([
  z.boolean(),
  z.literal("structure"),
]);

const selectConfigExtensionsSchema = z.union([
  z.boolean(),
  z.record(z.string(), z.boolean()),
]);

const selectConfigSchemaObjectSchema = z.intersection(
  z.object({
    $default: selectConfigDefaultSchema.optional(),
    $extensions: selectConfigExtensionsSchema.optional(),
  }),
  z.record(
    z.string().refine((s) => s !== "$default" && s !== "$extensions"),
    z.union([selectConfigDefaultSchema, selectConfigExtensionsSchema]),
  ),
);

const selectConfigSchemaSchema = z.union([
  selectConfigDefaultSchema,
  selectConfigSchemaObjectSchema,
]);

export const selectConfigSchema = z.intersection(
  z.object({
    $default: selectConfigDefaultSchema.optional(),
  }),
  z.record(
    z.string(),
    z.union([
      selectConfigSchemaSchema,
      z.intersection(
        z.object({
          $default: selectConfigDefaultSchema.optional(),
          $extensions: selectConfigExtensionsSchema.optional(),
        }),
        z.record(z.string(), selectConfigSchemaSchema),
      ),
    ]),
  ),
);
