import { betterSqlite3Adapter } from "./better-sqlite3/better-sqlite3.js";
import { mysql2Adapter } from "./mysql2/mysql2.js";
import { pgAdapter } from "./pg/pg.js";
import { postgresAdapter } from "./postgres/postgres.js";
import { prismaAdapter } from "./prisma/prisma.js";

export const ormAdapters = {
  [prismaAdapter.id]: prismaAdapter,
};

export const postgresAdapters = {
  [pgAdapter.id]: pgAdapter,
  [postgresAdapter.id]: postgresAdapter,
};

export const sqliteAdapters = {
  [betterSqlite3Adapter.id]: betterSqlite3Adapter,
};

export const mysqlAdapters = {
  [mysql2Adapter.id]: mysql2Adapter,
};

export const adapters = {
  ...ormAdapters,
  ...postgresAdapters,
  ...sqliteAdapters,
  ...mysqlAdapters,
};

export type AdapterId = keyof typeof adapters;
