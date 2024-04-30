import { type Database } from "better-sqlite3";
import dedent from "dedent";
import { DatabaseClient } from "#core/databaseClient.js";
import { type Adapter } from "../types.js";

export class SeedBetterSqlite3 extends DatabaseClient<Database> {
  static id = "better-sqlite3" as const;

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
  getDialect: () => "sqlite",
  id: "better-sqlite3" as const,
  name: "better-sqlite3",
  packageName: "better-sqlite3",
  typesPackageName: "@types/better-sqlite3",
  template: (parameters = `'<your-database-path>', { fileMustExist: true }`) => dedent`
    import { SeedBetterSqlite3 } from "@snaplet/seed/adapter-better-sqlite3";
    import { defineConfig } from "@snaplet/seed/config";
    import Database from "better-sqlite3";

    export default defineConfig({
      adapter: () => {
        const client = new Database(${parameters});
        return new SeedBetterSqlite3(client);
      },
    });
  `,
} satisfies Adapter;
