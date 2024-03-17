import { type Database } from "better-sqlite3";
import { DatabaseClient } from "#core/databaseClient.js";
import { type Adapter } from "../types.js";

export class SeedBetterSqlite3 extends DatabaseClient<Database> {
  static id = "better-sqlite3" as const;

  constructor(client: Database) {
    super("sqlite", client);
  }

  async disconnect(): Promise<void> {
    // no-op
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async execute(query: string): Promise<void> {
    this.client.prepare(query).run();
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async query<K>(query: string): Promise<Array<K>> {
    const res = this.client.prepare(query).all();
    return res as Array<K>;
  }
}

export const betterSqlite3Adapter = {
  id: "better-sqlite3" as const,
  className: "SeedBetterSqlite3",
} satisfies Adapter;
