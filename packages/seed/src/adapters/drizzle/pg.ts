import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import { type PgDatabase } from "drizzle-orm/pg-core";
import { type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import { type DrizzleDatabase } from "./types.js";
import { getSessionName } from "./utils.js";

// Detects "pg" dialect
export const isPgDatabase = (
  client: DrizzleDatabase,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): client is PgDatabase<any> => {
  return client.constructor.name === "PgDatabase";
};

export const isPostgresJs = (
  client: DrizzleDatabase,
): client is PostgresJsDatabase => {
  return getSessionName(client) === "PostgresJsSession";
};

export const isNodePg = (client: DrizzleDatabase): client is NodePgDatabase => {
  return getSessionName(client) === "NodePgSession";
};
