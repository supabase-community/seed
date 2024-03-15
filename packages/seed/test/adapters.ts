// context(justinvdm, 7 Mar 2024): Disabled to allow for per-adapter type references inline
/* eslint-disable @typescript-eslint/consistent-type-imports */
import type postgresJs from "postgres";
import { type DatabaseClient } from "#core/adapters.js";
import { PostgresJsClient } from "#dialects/postgres/drivers/postgres-js/postgres-js.js";
import { BetterSqlite3Client } from "#dialects/sqlite/drivers/better-sqlite3/better-sqlite3.js";

export interface Adapter<Client = AnyClient> {
  createClient(client: Client): DatabaseClient;
  createTestDb(structure?: string): Promise<{
    client: DatabaseClient;
    connectionString: string;
    name: string;
  }>;
  generateClientWrapper(props: {
    connectionString: string;
    generateOutputIndexPath: string;
  }): string;
  skipReason?: string;
}

export type Adapters = typeof adapters;

export type Dialect = keyof Adapters;

export type AnyClient =
  Awaited<ReturnType<Adapters[Dialect]>> extends Adapter<infer Client>
    ? Client
    : never;

export const adapters = {
  async postgres(): Promise<Adapter<postgresJs.Sql>> {
    const { createTestDb } = (await import("#test/postgres/index.js"))
      .postgresJs;
    return {
      createTestDb,
      createClient: (client) => new PostgresJsClient(client),
      generateClientWrapper: ({
        generateOutputIndexPath,
        connectionString,
      }) => `
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { createDrizzleORMPgClient } from "@snaplet/seed/dialects/postgres/adapters"
import { createSeedClient as baseCreateSeedClient } from "${generateOutputIndexPath}"

const client = postgres("${connectionString}")

const drizzleDb = drizzle(client)

export const db = createDrizzleORMPgClient(drizzleDb)

export const end = () => client.end()

export const createSeedClient = (options?: Parameters<typeof baseCreateSeedClient>[1]) => baseCreateSeedClient(drizzleDb, options)
`,
    };
  },
  async sqlite(): Promise<Adapter<import("better-sqlite3").Database>> {
    const { createTestDb } = (await import("#test/sqlite/index.js"))
      .betterSqlite3;
    return {
      createTestDb,
      createClient: (client) => new BetterSqlite3Client(client),
      generateClientWrapper: ({
        generateOutputIndexPath,
        connectionString,
      }) => `
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { createDrizzleORMSqliteClient } from "@snaplet/seed/dialects/sqlite/adapters"
import { createSeedClient as baseCreateSeedClient } from "${generateOutputIndexPath}"

const client = new Database(new URL("${connectionString}").pathname, { fileMustExist: false })

const drizzleDb = drizzle(client)

export const db = createDrizzleORMSqliteClient(drizzleDb)

export const end = () => client.close()

export const createSeedClient = (options?: Parameters<typeof baseCreateSeedClient>[1]) => baseCreateSeedClient(drizzleDb, options)
`,
    };
  },
} as const;
