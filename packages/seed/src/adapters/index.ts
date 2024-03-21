import { betterSqlite3Adapter } from "./better-sqlite3/better-sqlite3.js";
import { drizzleAdapter } from "./drizzle/drizzle.js";
import { pgAdapter } from "./pg/pg.js";
import { postgresAdapter } from "./postgres/postgres.js";
import { prismaAdapter } from "./prisma/prisma.js";

export const ormAdapters = {
  [drizzleAdapter.id]: drizzleAdapter,
  [prismaAdapter.id]: prismaAdapter,
};

export const postgresAdapters = {
  [pgAdapter.id]: pgAdapter,
  [postgresAdapter.id]: postgresAdapter,
};

export const sqliteAdapters = {
  [betterSqlite3Adapter.id]: betterSqlite3Adapter,
};

export const adapters = {
  ...ormAdapters,
  ...postgresAdapters,
  ...sqliteAdapters,
};

export type AdapterId = keyof typeof adapters;
