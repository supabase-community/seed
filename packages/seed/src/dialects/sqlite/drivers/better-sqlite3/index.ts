import { type Database } from "better-sqlite3";
import { BetterSqlite3Client } from "./better-sqlite3.js";

export function createDatabaseClient(client: Database) {
  return new BetterSqlite3Client(client);
}

export type { DatabaseClient } from "#core/databaseClient.js";
