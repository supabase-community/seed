import { type Database } from "better-sqlite3";
import { DatabaseClient } from "#core/databaseClient.js";
import { type Adapter } from "../types.js";

export class BetterSqlite3Client extends DatabaseClient<Database> {
  constructor(client: Database) {
    super("sqlite", client);
  }

  async disconnect(): Promise<void> {
    // no-op
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async query<K>(query: string): Promise<Array<K>> {
    const res = this.client.prepare(query).all();
    return res as Array<K>;
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async run(query: string): Promise<void> {
    this.client.prepare(query).run();
  }
}

export const betterSqlite3Adapter = {
  id: "better-sqlite3" as const,
  className: "BetterSqlite3Client",
} satisfies Adapter;
