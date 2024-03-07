// context(justinvdm, 7 Mar 2024): Disabled to allow for per-adapter type references inline
/* eslint-disable @typescript-eslint/consistent-type-imports */
import type postgresJs from "postgres";
import { type DrizzleDbClient } from "#core/adapters.js";

export interface Adapter<Client = AnyClient> {
  createClient(client: Client): DrizzleDbClient;
  createTestDb(structure?: string): Promise<{
    client: Client;
    connectionString: string;
    name: string;
  }>;
  generateClientWrapper(props: {
    connectionString: string;
    generateOutputPath: string;
  }): string;
  skipReason?: string;
}

// todo(justinvdm, 7 Mar 2024): Ideally we could use import.meta.resolve,
// but I that ends up with a __vite_ssr_import_meta__.resolve is not a function
const resolveDepPath = (name: string) => require.resolve(name);

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
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const { createDrizzleORMPgClient } = await import(
      "#dialects/postgres/adapters.js"
    );
    return {
      createTestDb,
      createClient: (client) => createDrizzleORMPgClient(drizzle(client)),
      generateClientWrapper: ({ generateOutputPath, connectionString }) => `
import postgres from "${resolveDepPath("postgres")}";
import { drizzle } from "${resolveDepPath("drizzle-orm/postgres-js")}";
import { createSeedClient as baseCreateSeedClient } from "${generateOutputPath}";

const client = postgres("${connectionString}")
const db = drizzle(client);

export const end = () => client.end()

export const createSeedClient = (options) => baseCreateSeedClient(db, options)
`,
    };
  },
  async sqlite(): Promise<Adapter<import("better-sqlite3").Database>> {
    const { createTestDb } = (await import("#test/sqlite/index.js"))
      .betterSqlite3;
    const { drizzle } = await import("drizzle-orm/better-sqlite3");
    const { createDrizzleORMSqliteClient } = await import(
      "#dialects/sqlite/adapters.js"
    );
    return {
      // todo(justinvdm, 7 Mar 2024):
      // https://linear.app/snaplet/issue/S-1923/support-sqlite-in-introspect-command
      skipReason: "Not yet supported with introspect command",
      createTestDb,
      createClient: (client) => createDrizzleORMSqliteClient(drizzle(client)),
      generateClientWrapper: ({ generateOutputPath, connectionString }) => `
import Database from "${resolveDepPath("better-sqlite3")}";
import { drizzle } from "${resolveDepPath("drizzle-orm/better-sqlite3")}";
import { createSeedClient as baseCreateSeedClient } from "${generateOutputPath}";

const client = new Database("${connectionString}")

const db = drizzle(client);

export const end = () => client.close()

export const createSeedClient = (options) => baseCreateSeedClient(db, options)
`,
    };
  },
} as const;
