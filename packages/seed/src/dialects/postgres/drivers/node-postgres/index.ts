import { type Client } from "pg";
import { NodePostgresClient } from "./node-postgres.js";

export function createDatabaseClient(client: Client) {
  return new NodePostgresClient(client);
}
