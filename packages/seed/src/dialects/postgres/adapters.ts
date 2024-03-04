/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { sql } from "drizzle-orm";
import { type PgDatabase, type QueryResultHKT } from "drizzle-orm/pg-core";
import { DrizzleDbClient } from "#core/adapters.js";

export class DrizzleORMPgClient extends DrizzleDbClient<
  PgDatabase<QueryResultHKT>
> {
  async query<K = QueryResultHKT>(
    query: string,
    _values?: Array<any> | undefined,
  ): Promise<Array<K>> {
    const res = await this.db.execute(sql.raw(query));
    // @ts-expect-error cannot infer the type of the result
    return res.rows as Array<K>;
  }
  async run(query: string): Promise<void> {
    await this.db.execute(sql.raw(query));
  }
}

export class DrizzleORMPostgresJsClient extends DrizzleDbClient<
  PgDatabase<QueryResultHKT>
> {
  async query<K = QueryResultHKT>(
    query: string,
    _values?: Array<any> | undefined,
  ): Promise<Array<K>> {
    const res = await this.db.execute(sql.raw(query));
    return res as Array<K>;
  }
  async run(query: string): Promise<void> {
    await this.db.execute(sql.raw(query));
  }
}

type PgAdapterName = "NodePgSession" | "PostgresJsSession";

export function createDrizzleORMPgClient(
  db: PgDatabase<QueryResultHKT>,
): DrizzleORMPgClient {
  // @ts-expect-error - we need to use the drizzle internal adapter session name to determine the adapter
  const sessionName = db.session.constructor.name as PgAdapterName;
  switch (sessionName) {
    case "PostgresJsSession":
      return new DrizzleORMPostgresJsClient(db);
    case "NodePgSession":
      return new DrizzleORMPgClient(db);
    default:
      return new DrizzleORMPgClient(db);
  }
}
