import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { readFileSync } from "fs-extra";
import path from "node:path";
import { Client } from "pg";
import { v4 } from "uuid";

interface State {
  dbs: Array<{
    client: Client;
    name: string;
  }>;
}

const TEST_DATABASE_SERVER =
  process.env["TEST_DATABASE_SERVER"] ??
  "postgres://postgres@localhost/postgres";
const TEST_DATABASE_PREFIX = "testdb";

export const defineCreateTestDb = (state: State) => {
  const connString = TEST_DATABASE_SERVER;
  const serverClient = new Client({ connectionString: connString });
  const serverDrizzle = drizzle(serverClient, { logger: false });
  let clientConnected = false;
  const createTestDb = async (structure?: string) => {
    if (!clientConnected) {
      await serverClient.connect();
      clientConnected = true;
    }
    const dbName = `${TEST_DATABASE_PREFIX}${v4()}`;
    await serverDrizzle.execute(
      sql.raw(`DROP DATABASE IF EXISTS "${dbName}";`),
    );
    await serverDrizzle.execute(sql.raw(`CREATE DATABASE "${dbName}"`));
    const client = new Client({
      host: serverClient.host,
      port: serverClient.port,
      user: serverClient.user,
      password: serverClient.password,
      database: dbName,
    });
    await client.connect();
    const result = {
      client: client,
      name: dbName,
    };
    state.dbs.push(result);
    if (structure) {
      await drizzle(client).execute(sql.raw(structure));
    }
    return result;
  };

  createTestDb.afterEach = async () => {
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
