import { type Sql as PgClient } from 'postgres'
import { type Database as SqliteClient} from 'better-sqlite3';
import { DrizzleDbClient } from '#core/adapters.js';

export type AnyClient = PgClient | SqliteClient

export type Adapters = typeof adaptersByDialect;

export type Dialect = keyof Adapters;

export type Adapter<Client extends AnyClient = AnyClient> = {
  createTestDb(structure?: string): Promise<{
    client: Client,
    name: string
  }>,
  createClient(client: Client): DrizzleDbClient
}

export const adaptersByDialect = {
  async postgres(): Promise<Adapter<PgClient>> {
    const { createTestDb } = (await import("#test/postgres/index.js")).postgresJs;
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const { createDrizzleORMPgClient } = await import("#dialects/postgres/adapters.js");
    return {
      createTestDb,
      createClient: client => createDrizzleORMPgClient(drizzle(client)),
    };
  },
  async sqlite(): Promise<Adapter<SqliteClient>> {
    const { createTestDb } = (await import("#test/sqlite/index.js")).betterSqlite3;
    const { drizzle } = await import("drizzle-orm/better-sqlite3");
    const { createDrizzleORMSqliteClient } = await import("#dialects/sqlite/adapters.js")
    return {
      createTestDb,
      createClient: client => createDrizzleORMSqliteClient(drizzle(client)),
    };
  },
} as const;
