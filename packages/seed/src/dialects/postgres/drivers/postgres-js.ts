import { sql } from "drizzle-orm";
import { type PgDatabase, type QueryResultHKT } from "drizzle-orm/pg-core";
import { DrizzleDbClient } from "#core/adapters.js";
import { postgresDatabaseUrlHint } from "./constants.js";
import { type Driver } from "./types.js";

export class DrizzleORMPostgresJsClient extends DrizzleDbClient<
  PgDatabase<QueryResultHKT>
> {
  async query<K = QueryResultHKT>(
    query: string,
    _values?: Array<unknown> | undefined,
  ): Promise<Array<K>> {
    const res = await this.db.execute(sql.raw(query));
    return res as Array<K>;
  }
  async run(query: string): Promise<void> {
    await this.db.execute(sql.raw(query));
  }
}

export const postgresJsDriver: Driver = {
  name: "Postgres.js",
  package: "postgres",
  parameters: [
    {
      kind: "scalar",
      name: "database url",
      hint: postgresDatabaseUrlHint,
    },
  ],
  async getClient(databaseUrl: string) {
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const postgres = (await import("postgres")).default;
    const { createDrizzleORMPostgresClient: createDrizzleORMPgClient } =
      await import("../adapters.js");
    const client = postgres(databaseUrl);
    const db = drizzle(client);
    return createDrizzleORMPgClient(db);
  },
};
