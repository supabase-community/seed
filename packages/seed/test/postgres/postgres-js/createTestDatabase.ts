import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { readFileSync } from "fs-extra";
import path from "node:path";
import postgres from "postgres";
import { v4 } from "uuid";

interface State {
  dbs: Array<{
    client: postgres.Sql;
    name: string;
  }>;
}

const TEST_DATABASE_SERVER =
  process.env["PG_TEST_DATABASE_SERVER"] ??
  "postgres://postgres@localhost/postgres";
const TEST_DATABASE_PREFIX = "testdb";

export const defineCreateTestDb = (state: State) => {
  const connString = TEST_DATABASE_SERVER;
  const serverClient = postgres(connString, { max: 1 });
  const serverDrizzle = drizzle(serverClient, { logger: false });
  const createTestDb = async (structure?: string) => {
    const dbName = `${TEST_DATABASE_PREFIX}${v4()}`;
    await serverDrizzle.execute(sql.raw(`DROP DATABASE IF EXISTS "${dbName}"`));
    await serverDrizzle.execute(sql.raw(`CREATE DATABASE "${dbName}"`));
    const client = postgres(connString, { max: 1, database: dbName });
    const url = new URL(connString);
    url.pathname = `/${dbName}`;

    const result = {
      client: client,
      name: dbName,
      connectionString: url.toString(),
    };
    state.dbs.push(result);
    if (structure) {
      await drizzle(client).execute(sql.raw(structure));
    }
    return result;
  };

  createTestDb.afterAll = async () => {
    const dbs = state.dbs;
    state.dbs = [];

    const failures: Array<{ dbName: string; error: Error }> = [];

    // Close all pools connections on the database, if there is more than one to be able to drop it
    for (const { client, name } of dbs) {
      try {
        await client.end();
        await serverDrizzle.execute(
          sql.raw(`DROP DATABASE IF EXISTS "${name}" WITH (force)`),
        );
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
  await drizzle(db.client).execute(sql.raw(snapletSchemaSql.toString()));
  return db;
};
