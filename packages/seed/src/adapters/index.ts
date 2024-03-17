import { betterSqlite3Adapter } from "./better-sqlite3/better-sqlite3.js";
import { pgAdapter } from "./pg/pg.js";
import { postgresAdapter } from "./postgres/postgres.js";

export const adapters = {
  [betterSqlite3Adapter.id]: betterSqlite3Adapter,
  [pgAdapter.id]: pgAdapter,
  [postgresAdapter.id]: postgresAdapter,
};

export type AdapterId = keyof typeof adapters;
