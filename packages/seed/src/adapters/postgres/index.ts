import { type Sql } from "postgres";
import { PostgresClient } from "./postgres.js";

export function createDatabaseClient(client: Sql) {
  return new PostgresClient(client);
}

export type { DatabaseClient } from "#core/databaseClient.js";
