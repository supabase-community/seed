import * as z from "zod";
import { nodePostgresSchema } from "#dialects/postgres/drivers/node-postgres.js";
import { postgresJsSchema } from "#dialects/postgres/drivers/postgres-js.js";
import { betterSqlite3Schema } from "#dialects/sqlite/drivers/better-sqlite3.js";

export const databaseClientConfigSchema = z.union([
  postgresJsSchema,
  nodePostgresSchema,
  betterSqlite3Schema,
]);

export type DatabaseClientConfig = z.infer<typeof databaseClientConfigSchema>;
