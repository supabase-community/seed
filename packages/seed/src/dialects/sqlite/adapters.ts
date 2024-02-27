/* eslint-disable @typescript-eslint/no-explicit-any */
import { is, sql } from "drizzle-orm";
import { BetterSQLiteSession } from "drizzle-orm/better-sqlite3";
import { SQLiteBunSession } from "drizzle-orm/bun-sqlite";
import { type BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import { DrizzleDbClient } from "#core/adapters.js";

export class DrizzleORMBetterSQLiteClient extends DrizzleDbClient<
  BaseSQLiteDatabase<"async" | "sync", unknown, any>
> {
  async query<K>(
    query: string,
    _values?: Array<any> | undefined,
  ): Promise<Array<K>> {
    const res = await this.db.all(sql.raw(query));
    return res as Array<K>;
  }
  async run(query: string): Promise<void> {
    await this.db.run(sql.raw(query));
  }
}

export class DrizzleORMSqliteBunClient extends DrizzleDbClient<
  BaseSQLiteDatabase<"async" | "sync", unknown, any>
> {
  async query<K>(
    query: string,
    _values?: Array<any> | undefined,
  ): Promise<Array<K>> {
    const res = await this.db.all(sql.raw(query));
    return res as Array<K>;
  }
  async run(query: string): Promise<void> {
    await this.db.run(sql.raw(query));
  }
}

export function createDrizzleORMSqliteClient(
  db: BaseSQLiteDatabase<"async" | "sync", unknown, any>,
): DrizzleDbClient {
  // @ts-expect-error - we need to use the drizzle internal adapter session name to determine the adapter
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const session = db.session;
  if (is(session, BetterSQLiteSession)) {
    return new DrizzleORMBetterSQLiteClient(db);
  }
  if (is(session, SQLiteBunSession)) {
    return new DrizzleORMSqliteBunClient(db);
  }
  return new DrizzleORMBetterSQLiteClient(db);
}
