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
  generateSeedConfig(connectionString: string, config?: string): string;
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
    return {
      createTestDb,
      generateSeedConfig: (connectionString: string, config?: string) => dedent`
      import { defineConfig } from "@snaplet/seed/config";
      import { SeedPostgres } from "@snaplet/seed/adapter-postgres";
      import postgres from "postgres";

      export default defineConfig({
        adapter: () => new SeedPostgres(postgres("${connectionString}")),
        ${config ?? ""}
      })
    `,
      createClient: (client) => new SeedPostgres(client),
    };
  },
  async sqlite(): Promise<Adapter<import("better-sqlite3").Database>> {
    const { createTestDb } = (await import("#test/sqlite/index.js"))
      .betterSqlite3;
    return {
      createTestDb,
      createClient: (client) => new SeedBetterSqlite3(client),
      generateSeedConfig: (connectionString: string, config?: string) => dedent`
        import { defineConfig } from "@snaplet/seed/config";
        import { SeedBetterSqlite3 } from "@snaplet/seed/adapter-better-sqlite3";
        import Database from "better-sqlite3";

        export default defineConfig({
          adapter: () => new SeedBetterSqlite3(new Database(new URL("${connectionString}").pathname)),
          ${config ?? ""}
        })
      `,
    };
  },
} as const;
