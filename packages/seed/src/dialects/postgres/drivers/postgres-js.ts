import { sql } from "drizzle-orm";
import { type PgDatabase, type QueryResultHKT } from "drizzle-orm/pg-core";
import { DatabaseClient } from "#core/adapters.js";
import { postgresDatabaseUrlHint } from "./constants.js";
import { createDrizzleORMPostgresClient } from "./createDrizzleORMPgClient.js";
import { type Driver } from "./types.js";

export class DrizzleORMPostgresJsClient extends DatabaseClient<
  PgDatabase<QueryResultHKT>
> {
  async disconnect(): Promise<void> {
    // to be done
  }
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
    const client = postgres(databaseUrl);
    const db = drizzle(client);
    return createDrizzleORMPostgresClient(db);
  },
};
