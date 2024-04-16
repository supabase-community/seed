import { readFileSync } from "fs-extra";
import { createConnection, escape, escapeId } from "mysql2/promise";
import path from "node:path";
import { v4 } from "uuid";
import { SeedMysql2 } from "#adapters/mysql2/mysql2.js";
import { type DatabaseClient } from "#core/databaseClient.js";

interface State {
  dbs: Array<{
    client: DatabaseClient;
    name: string;
  }>;
}

const TEST_DATABASE_SERVER =
  process.env["MYSQL_TEST_DATABASE_SERVER"] ??
  "mysql://root@127.0.0.1:3306/mysql";
const TEST_DATABASE_PREFIX = "testdb";

/**
 * We get a notice logged in the console if the database does not exist.
 * To avoid that we made this helper.
 */
const dropDatabaseIfExists = async (client: DatabaseClient, dbName: string) => {
  const dbExists =
    (
      await client.query(
        `SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ${escape(dbName)}`,
      )
    ).length > 0;
  if (dbExists) {
    await client.execute(`DROP DATABASE IF EXISTS ${escapeId(dbName)}`);
  }
};

const defineCreateTestDb = (state: State) => {
  // Extract host, port, and default database from the DSN
  const url = new URL(TEST_DATABASE_SERVER);
  // Create a connection to the MySQL server
  const dbServerClient = createConnection({
    host: url.hostname,
    port: parseInt(url.port) || 3306,
    user: url.username,
    password: url.password === "" ? undefined : url.password,
    database: url.pathname.replace("/", "") || "mysql", // Default database from the DSN or fallback to 'mysql'
    multipleStatements: true,
  });

  const createTestDb = async (structure?: string) => {
    const server = await dbServerClient;
    await server.connect();
    const dbName = `${TEST_DATABASE_PREFIX}${v4()}`;
    const serverAdapter = new SeedMysql2(server);
    await dropDatabaseIfExists(serverAdapter, dbName);
    await serverAdapter.execute(`CREATE DATABASE ${escapeId(dbName)}`);
    const con = await createConnection({
      host: url.hostname,
      port: parseInt(url.port) || 3306,
      user: url.username,
      password: url.password ? undefined : url.password,
      database: dbName,
      multipleStatements: true,
    });
    await con.connect();
    const client = new SeedMysql2(con);
    const newUrl = new URL(url.toString());
    newUrl.pathname = `/${dbName}`;

    const result = {
      client: client,
      name: dbName,
      connectionString: newUrl.toString(),
    };
    state.dbs.push(result);
    if (structure) {
      await client.execute(structure);
    }
    return result;
  };

  createTestDb.afterAll = async () => {
    const server = await dbServerClient;
    await server.connect();
    const serverAdapter = new SeedMysql2(server);
    const dbs = state.dbs;
    state.dbs = [];

    const failures: Array<{ dbName: string; error: Error }> = [];

    // Close all pools connections on the database, if there is more than one to be able to drop it
    for (const { name } of dbs) {
      try {
        await dropDatabaseIfExists(serverAdapter, name);
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
