import { type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { type BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import { type DrizzleDatabase } from "./types.js";
import { getSessionName } from "./utils.js";

// Detects "sqlite" dialect
export const isBaseSQLiteDatabase = (
  client: DrizzleDatabase,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): client is BaseSQLiteDatabase<any, any> => {
  return client.constructor.name === "BaseSQLiteDatabase";
};

export const isBetterSQLite = (
  client: DrizzleDatabase,
): client is BetterSQLite3Database => {
  return getSessionName(client) === "isBetterSQLite";
};
