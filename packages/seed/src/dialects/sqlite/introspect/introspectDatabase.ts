import { sql } from "drizzle-orm";
import { type BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";

export async function introspectDatabase<T extends "async" | "sync", R>(
  client: BaseSQLiteDatabase<T, R>,
): Promise<any> {
  const result = client.get(sql.raw(`SELECT * FROM "Table1";`));
  return {
    result,
  };
}
