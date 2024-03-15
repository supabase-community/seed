import { type Sql } from "postgres";
import { PostgresJsClient } from "./postgres-js.js";

export function createDatabaseClient(client: Sql) {
  return new PostgresJsClient(client);
}
