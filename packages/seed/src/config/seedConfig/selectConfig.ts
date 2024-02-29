import * as z from "zod";

// Select config must be something like:
// {
//   select: {
//     'public.*': false,               // set default schema to false
//     'public.tableName': true,        // specifically allow tableName
//     'public._.*': false,            // in public schema ignore all tables strating with underscore
//   }
// }
export const selectConfigSchema = z.record(z.string(), z.boolean());

export type SelectConfig = z.infer<typeof selectConfigSchema>;
