import { readFileSync } from "fs-extra";
import path from "node:path";
import postgres from "postgres";
import { v4 } from "uuid";
import { SeedPostgres } from "#adapters/postgres/postgres.js";
import { type DatabaseClient } from "#core/databaseClient.js";

interface State {
  dbs: Array<{
    client: DatabaseClient;
    name: string;
  }>;
}

const TEST_DATABASE_SERVER =
  process.env["PG_TEST_DATABASE_SERVER"] ??
  "postgres://postgres@127.0.0.1:5432/postgres";
const TEST_DATABASE_PREFIX = "testdb";

/**
 * We get a notice logged in the console if the database does not exist.
 * To avoid that we made this helper.
 */
const dropDatabaseIfExists = async (client: DatabaseClient, dbName: string) => {
  const dbExists =
    (
      await client.query(
        `SELECT 1 FROM pg_database WHERE datname = '${dbName}'`,
      )
    ).length > 0;
  if (dbExists) {
    await client.execute(`DROP DATABASE IF EXISTS "${dbName}" WITH (force)`);
  }
};

const defineCreateTestDb = (state: State) => {
  const connString = TEST_DATABASE_SERVER;
  const dbServerClient = new SeedPostgres(postgres(connString, { max: 1 }));
  const createTestDb = async (structure?: string) => {
    const dbName = `${TEST_DATABASE_PREFIX}${v4()}`;
    await dropDatabaseIfExists(dbServerClient, dbName);
    await dbServerClient.execute(`CREATE DATABASE "${dbName}"`);
    const client = new SeedPostgres(
      postgres(connString, { max: 1, database: dbName }),
    );
    const url = new URL(connString);
    url.pathname = `/${dbName}`;

    const result = {
      client: client,
      name: dbName,
      connectionString: url.toString(),
    };
    state.dbs.push(result);
    if (structure) {
      await client.execute(structure);
    }
    return result;
  };

  createTestDb.afterAll = async () => {
    const dbs = state.dbs;
    state.dbs = [];

    const failures: Array<{ dbName: string; error: Error }> = [];

    // Close all pools connections on the database, if there is more than one to be able to drop it
    for (const { name } of dbs) {
      try {
        await dropDatabaseIfExists(dbServerClient, name);
      } catch (error) {
        failures.push({
          dbName: name,
          error: error as Error,
        });
      }
    }

    if (failures.length) {
      throw new Error(
        [
          "Failed to delete all dbNames, note that these will need to be manually cleaned up:",
          JSON.stringify(failures, null, 2),
        ].join("\n"),
      );
    }
  };

  return createTestDb;
};

export const createTestDb = defineCreateTestDb({ dbs: [] });

export const createSnapletTestDb = async () => {
  const db = await createTestDb();
  const snapletSchemaSql = readFileSync(
    path.resolve(__dirname, "../fixtures/snaplet_schema.sql"),
  );
  await db.client.execute(snapletSchemaSql.toString());
  return db;
};
