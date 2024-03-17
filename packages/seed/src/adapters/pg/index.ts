import { type Client } from "pg";
import { PgClient } from "./pg.js";

export function createDatabaseClient(client: Client) {
  return new PgClient(client);
}

export type { DatabaseClient } from "#core/databaseClient.js";
