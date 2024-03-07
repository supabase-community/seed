import { DrizzleDbClient } from '#core/adapters.js';

export type Adapter<Client = AnyClient> = {
  createTestDb(structure?: string): Promise<{
    client: Client,
    name: string
  }>,
  createClient(client: Client): DrizzleDbClient
  generateClientWrapper(props: { generateOutputPath: string, connectionString: string }): string
}

export type Adapters = typeof adapters;

export type AdapterName = keyof Adapters;

export type AnyClient = Awaited<ReturnType<Adapters[AdapterName]>> extends Adapter<infer Client>
  ? Client
  : never

export const adapters = {
  async postgresJs(): Promise<Adapter<import("postgres").Sql>> {
    const { createTestDb } = (await import("#test/postgres/index.js")).postgresJs;
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const { createDrizzleORMPgClient } = await import("#dialects/postgres/adapters.js");
    return {
      createTestDb,
      createClient: client => createDrizzleORMPgClient(drizzle(client)),
      generateClientWrapper: ({ generateOutputPath, connectionString }) => `
import postgres from "postres";
import { drizzle } from "drizzle-orm/postgres-js";
import { createSeedClient as baseCreateSeedClient } from "${generateOutputPath}";

const db = drizzle(postgres("${connectionString}"));

export const createSeedClient = (options) => createSeedClient(db, options)
`
    };
  },
  async betterSqlite3(): Promise<Adapter<import("better-sqlite3").Database>> {
    const { createTestDb } = (await import("#test/sqlite/index.js")).betterSqlite3;
    const { drizzle } = await import("drizzle-orm/better-sqlite3");
    const { createDrizzleORMSqliteClient } = await import("#dialects/sqlite/adapters.js")
    return {
      createTestDb,
      createClient: client => createDrizzleORMSqliteClient(drizzle(client)),
      generateClientWrapper: ({ generateOutputPath, connectionString }) => `
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { createSeedClient as baseCreateSeedClient } from "${generateOutputPath}";

const db = drizzle(new Database("${connectionString}"));

export const createSeedClient = (options) => createSeedClient(db, options)
`
    };
  },
} as const;
