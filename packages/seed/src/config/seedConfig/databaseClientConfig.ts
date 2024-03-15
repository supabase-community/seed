import * as z from "zod";
import { DatabaseClient } from "#core/adapters.js";
// import { nodePostgresSchema } from "#dialects/postgres/drivers/node-postgres/node-postgres.js";
// import { postgresJsSchema } from "#dialects/postgres/drivers/postgres-js/postgres-js.js";
// import { betterSqlite3Schema } from "#dialects/sqlite/drivers/better-sqlite3/better-sqlite3.js";

export const databaseClientConfigSchema = z
  .function()
  .returns(z.instanceof(DatabaseClient));

// export const databaseClientConfigSchema = z.union([
//   postgresJsSchema,
//   nodePostgresSchema,
//   betterSqlite3Schema,
// ]);

export type DatabaseClientConfig = z.infer<typeof databaseClientConfigSchema>;
