import { type Database } from "better-sqlite3";
import { DatabaseClient } from "#core/adapters.js";

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
    this.client.prepare(query).all();
  }
}

export const betterSqlite3Driver = {
  name: "better-sqlite3",
  package: "better-sqlite3",
  definitelyTyped: "@types/better-sqlite3",
  parameters: [
    {
      name: "file name",
      kind: "scalar",
    },
  ],
  async getClient(databasePath: string) {
    const Database = (await import("better-sqlite3")).default;
    const client = new Database(databasePath);
    return new BetterSqlite3Client(client);
  },
};
