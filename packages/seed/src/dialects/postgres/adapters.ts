/* eslint-disable @typescript-eslint/no-explicit-any */
import { is, sql } from "drizzle-orm";
import { NodePgSession } from "drizzle-orm/node-postgres";
import { type PgDatabase, type QueryResultHKT } from "drizzle-orm/pg-core";
import { PostgresJsSession } from "drizzle-orm/postgres-js";
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

export function createDrizzleORMPgClient(
  db: PgDatabase<QueryResultHKT>,
): DrizzleDbClient {
  // @ts-expect-error - we need to use the drizzle internal adapter session name to determine the adapter
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const session = db.session;
  if (is(session, PostgresJsSession)) {
    return new DrizzleORMPostgresJsClient(db);
  }
  if (is(session, NodePgSession)) {
    return new DrizzleORMPgClient(db);
  }
  return new DrizzleORMPgClient(db);
}
