// context(justinvdm, 7 Mar 2024): Disabled to allow for per-adapter type references inline
import { type Database } from "better-sqlite3";
/* eslint-disable @typescript-eslint/consistent-type-imports */
import dedent from "dedent";
import { Connection } from "mysql2/promise";
import { Sql } from "postgres";
import { SeedBetterSqlite3 } from "#adapters/better-sqlite3/better-sqlite3.js";
import { AdapterId } from "#adapters/index.js";
import { SeedMysql2 } from "#adapters/mysql2/mysql2.js";
import { SeedPostgres } from "#adapters/postgres/postgres.js";
import { DatabaseClient } from "#core/databaseClient.js";
import { Dialect } from "#core/dialect/types.js";
import { mysqlDialect } from "#dialects/mysql/dialect.js";
import { DialectId } from "../src/dialects/dialects.js";
import { postgresDialect } from "../src/dialects/postgres/dialect.js";
import { sqliteDialect } from "../src/dialects/sqlite/dialect.js";
import { createTestDb as mysqlCreateTestDb } from "./mysql/mysql/createTestDatabase.js";
import { createTestDb as postgresCreateTestDb } from "./postgres/postgres/createTestDatabase.js";
import { createTestDb as sqliteCreateTestDb } from "./sqlite/better-sqlite3/createTestDatabase.js";

export interface Adapter<Client = unknown> {
  createClient(client: Client): DatabaseClient;
  createTestDb(structure?: string): Promise<{
    client: DatabaseClient;
    connectionString: string;
    name: string;
  }>;
  dialect: Dialect;
  generateSeedConfig(
    connectionString: string,
    config?: {
      alias?: string;
      select?: string;
    },
  ): string;
  id: AdapterId;
  skipReason?: string;
}

export const adapters: Record<DialectId, Adapter> = {
  postgres: {
    id: "postgres",
    dialect: postgresDialect,
    createTestDb: postgresCreateTestDb,
    generateSeedConfig: (connectionString, config) => {
      const alias = `alias: ${config?.alias ?? `{ inflection: true }`},`;
      const select = config?.select ? `select: ${config.select},` : "";
      return dedent`
      import { defineConfig } from "@snaplet/seed/config";
      import { SeedPostgres } from "@snaplet/seed/adapter-postgres";
      import postgres from "postgres";

      export default defineConfig({
        adapter: () => new SeedPostgres(postgres("${connectionString}")),
        ${alias}
        ${select}
      })
    `;
    },
    createClient: (client: Sql) => new SeedPostgres(client),
  },
  sqlite: {
    id: "better-sqlite3",
    dialect: sqliteDialect,
    createTestDb: sqliteCreateTestDb,
    createClient: (client: Database) => new SeedBetterSqlite3(client),
    generateSeedConfig: (connectionString, config) => {
      const alias = `alias: ${config?.alias ?? `{ inflection: true }`},`;
      const select = config?.select ? `select: ${config.select},` : "";
      return dedent`
        import { defineConfig } from "@snaplet/seed/config";
        import { SeedBetterSqlite3 } from "@snaplet/seed/adapter-better-sqlite3";
        import Database from "better-sqlite3";

        export default defineConfig({
          adapter: () => new SeedBetterSqlite3(new Database(new URL("${connectionString}").pathname)),
          ${alias}
          ${select}
        })
      `;
    },
  },
  mysql: {
    id: "mysql2",
    dialect: mysqlDialect,
    createTestDb: mysqlCreateTestDb,
    createClient: (client: Connection) => new SeedMysql2(client),
    generateSeedConfig: (connectionString, config) => {
      const alias = `alias: ${config?.alias ?? `{ inflection: true }`},`;
      const select = config?.select ? `select: ${config.select},` : "";
      return dedent`
        import { defineConfig } from "@snaplet/seed/config";
        import { SeedMysql2 } from "@snaplet/seed/adapter-mysql2";
        import { createConnection } from "mysql2/promise";

        export default defineConfig({
          adapter: async () =>  {
            const client = await createConnection("${connectionString}");
            await client.connect();
            return new SeedMysql2(client)
          },
          ${alias}
          ${select}
        })
      `;
    },
  },
};

export const adapterEntries = Object.entries(adapters) as Array<
  [DialectId, Adapter]
>;
