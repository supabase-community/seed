// context(justinvdm, 7 Mar 2024): Disabled to allow for per-adapter type references inline
/* eslint-disable @typescript-eslint/consistent-type-imports */
import type postgres from "postgres";
import dedent from "dedent";
import { SeedBetterSqlite3 } from "#adapters/better-sqlite3/better-sqlite3.js";
import { SeedPostgres } from "#adapters/postgres/postgres.js";
import { type DatabaseClient } from "#core/databaseClient.js";

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
  generateSeedConfig(connectionString: string): string;
  generateSeedConfigDatabaseClient(connectionString: string): string;
  skipReason?: string;
}

export type Adapters = typeof adapters;

export type Dialect = keyof Adapters;

export type AnyClient =
  Awaited<ReturnType<Adapters[Dialect]>> extends Adapter<infer Client>
    ? Client
    : never;

export const adapters = {
  async postgres(): Promise<Adapter<postgres.Sql>> {
    const { createTestDb } = (await import("#test/postgres/index.js")).postgres;
    const generateSeedConfigDatabaseClient = (connectionString: string) =>
      `databaseClient: { adapter: "postgres", parameters: ["${connectionString}"] },`;
    return {
      createTestDb,
      generateSeedConfig: (connectionString: string) => dedent`
      import { defineConfig } from "@snaplet/seed/config";

      export default defineConfig({
        ${generateSeedConfigDatabaseClient(connectionString)}
      })
    `,
      generateSeedConfigDatabaseClient,
      createClient: (client) => new SeedPostgres(client),
      generateClientWrapper: ({
        generateOutputIndexPath,
        connectionString,
      }) => `
import postgres from "postgres";
import { createDatabaseClient } from "@snaplet/seed/postgres"
import { createSeedClient as baseCreateSeedClient } from "${generateOutputIndexPath}"

const client = postgres("${connectionString}")

export const db = createDatabaseClient(client)

export const end = () => client.end()

export const createSeedClient = (options?: Parameters<typeof baseCreateSeedClient>[0]) => baseCreateSeedClient({ databaseClient: db, ...options })
`,
    };
  },
  async sqlite(): Promise<Adapter<import("better-sqlite3").Database>> {
    const { createTestDb } = (await import("#test/sqlite/index.js"))
      .betterSqlite3;
    const generateSeedConfigDatabaseClient = (connectionString: string) =>
      `databaseClient: { adapter: "better-sqlite3", parameters: [new URL("${connectionString}").pathname] },`;
    return {
      createTestDb,
      createClient: (client) => new SeedBetterSqlite3(client),
      generateSeedConfigDatabaseClient,
      generateSeedConfig: (connectionString: string) => dedent`
        import { defineConfig } from "@snaplet/seed/config";

        export default defineConfig({
          ${generateSeedConfigDatabaseClient(connectionString)}
        })
      `,
      generateClientWrapper: ({
        generateOutputIndexPath,
        connectionString,
      }) => `
import Database from "better-sqlite3";
import { createDatabaseClient } from "@snaplet/seed/better-sqlite3"
import { createSeedClient as baseCreateSeedClient } from "${generateOutputIndexPath}"

const client = new Database(new URL("${connectionString}").pathname, { fileMustExist: false })

export const db = createDatabaseClient(client)

export const end = () => client.close()

export const createSeedClient = (options?: Parameters<typeof baseCreateSeedClient>[0]) => baseCreateSeedClient({ databaseClient: db, ...options })
`,
    };
  },
} as const;
