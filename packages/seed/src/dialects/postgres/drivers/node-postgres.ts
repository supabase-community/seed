import { sql } from "drizzle-orm";
import { type PgDatabase, type QueryResultHKT } from "drizzle-orm/pg-core";
import { DatabaseClient } from "#core/adapters.js";
import { postgresDatabaseUrlHint } from "./constants.js";
import { createDrizzleORMPostgresClient } from "./createDrizzleORMPgClient.js";

export class DrizzleORMNodePostgresClient extends DatabaseClient<
  PgDatabase<QueryResultHKT>
> {
  async query<K = QueryResultHKT>(
    query: string,
    _values?: Array<unknown> | undefined,
  ): Promise<Array<K>> {
    const res = await this.db.execute(sql.raw(query));
    // @ts-expect-error cannot infer the type of the result
    return res.rows as Array<K>;
  }
  async run(query: string): Promise<void> {
    await this.db.execute(sql.raw(query));
  }
}

export const nodePostgresDriver = {
  name: "node-postgres",
  package: "pg",
  definitelyTyped: "@types/pg",
  parameters: [
    {
      name: "options",
      kind: "object",
      properties: {
        connectionString: {
          kind: "scalar",
          name: "connection string",
          hint: postgresDatabaseUrlHint,
        },
      },
    },
  ],
  async getClient(options: { connectionString: string }) {
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { Client } = (await import("pg")).default;
    const client = new Client(options);
    const db = drizzle(client);
    return createDrizzleORMPostgresClient(db);
  },
};
