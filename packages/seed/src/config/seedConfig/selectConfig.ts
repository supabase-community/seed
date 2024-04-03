import * as z from "zod";

export const SELECT_WILDCARD_STRING = "*";

/**
 * Select config must be something like:
 * {
 *   select: {
 *     'public.*': false,              // set default schema to false
 *     'public.tableName': true,       // specifically allow tableName
 *     'public._.*': false,            // in public schema ignore all tables strating with underscore
 *     '*_prisma_migrations': false,   // ignore all tables ending with _prisma_migrations
 *     '*_*': false,                   // ignore all tables containing an underscore
 *   }
 * }
 */

export const selectConfigSchema = z.record(z.string(), z.boolean());

export type SelectConfig = z.infer<typeof selectConfigSchema>;
