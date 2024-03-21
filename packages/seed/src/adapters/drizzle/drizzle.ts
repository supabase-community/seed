import dedent from "dedent";
import { sql } from "drizzle-orm";
import { DatabaseClient } from "#core/databaseClient.js";
import { type Adapter } from "../types.js";
import { isNodePg, isPgDatabase, isPostgresJs } from "./pg.js";
import { isBaseSQLiteDatabase, isBetterSQLite } from "./sqlite.js";
import { type DrizzleDatabase } from "./types.js";
import { getSessionName } from "./utils.js";

export class SeedDrizzle extends DatabaseClient<DrizzleDatabase> {
  drizzleAdapter: string;

  constructor(client: DrizzleDatabase) {
    if (isPgDatabase(client)) {
      super("postgres", client);
    } else if (isBaseSQLiteDatabase(client)) {
      super("sqlite", client);
    } else {
      throw new Error(`Unsupported Drizzle dialect`);
    }

    this.drizzleAdapter = getSessionName(client).replace("Session", "");
  }

  async execute(query: string): Promise<void> {
    if (isPgDatabase(this.client)) {
      await this.client.execute(sql.raw(query));
    } else if (isBaseSQLiteDatabase(this.client)) {
      await this.client.run(sql.raw(query));
    }

    throw new Error(`Unsupported Drizzle adapter ${this.drizzleAdapter}`);
  }

  async query<K = object>(query: string): Promise<Array<K>> {
    if (isPostgresJs(this.client)) {
      const res = await this.client.execute(sql.raw(query));
      return res as Array<K>;
    } else if (isNodePg(this.client)) {
      const res = await this.client.execute(sql.raw(query));
      return res.rows as Array<K>;
    } else if (isBetterSQLite(this.client)) {
      const res = this.client.all(sql.raw(query));
      return res as Array<K>;
    }

    throw new Error(`Unsupported Drizzle adapter ${this.drizzleAdapter}`);
  }
}

export const drizzleAdapter = {
  id: "drizzle" as const,
  name: "Drizzle",
  packageName: "drizzle-orm",
  template: (parameters = `/* connection parameters */`) => dedent`
    import { SeedDrizzle } from "@snaplet/seed/adapter-drizzle";
    import { defineConfig } from "@snaplet/seed/config";
    import { drizzle } from "drizzle-orm/<drizzle-adapter>";

    export default defineConfig({
      adapter: () => {
        const db = drizzle(${parameters});
        return new SeedDrizzle(db);
      },
    });
  `,
} satisfies Adapter;
