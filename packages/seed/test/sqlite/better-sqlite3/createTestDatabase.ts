import Database from "better-sqlite3";
import { copyFile } from "fs-extra";
import path from "node:path";
import { SeedBetterSqlite3 } from "#adapters/better-sqlite3/better-sqlite3.js";
import { type DatabaseClient } from "#core/databaseClient.js";
import { createTestTmpDirectory } from "../../createTmpDirectory.js";

const CHINOOK_DATABASE_PATH = path.resolve(__dirname, "../fixtures/chinook.db");

// We need this because we can't use better-sqlite3 .exec method for all the tests
function splitSqlScript(script: string): Array<string> {
  // Split on semicolon followed by optional whitespace and new line characters.
  // This simple approach might not correctly handle semicolons within string literals or comments.
  const queries = script.split(/;\s*(\n|$)/);

  // Filter out any empty strings that might result from the split (e.g., after the last semicolon)
  return queries.filter((query) => query.trim() !== "");
}

export async function createTestDb(structure: string): Promise<{
  client: DatabaseClient;
  connectionString: string;
  name: string;
}> {
  const tmp = await createTestTmpDirectory(true);
  const connString = path.join(tmp.name, "test.sqlite3");
  const db = new Database(connString);
  const client = new SeedBetterSqlite3(db);
  const queries = splitSqlScript(structure);
  for (const query of queries) {
    await client.execute(query);
  }
  return {
    client,
    name: connString,
    connectionString: `file://${connString}`,
  };
}

// A sample database with data in it took from: https://www.sqlitetutorial.net/sqlite-sample-database/
export async function createChinookSqliteTestDatabase(): Promise<{
  client: DatabaseClient;
  connectionString: string;
  name: string;
}> {
  const tmp = await createTestTmpDirectory();
  const connString = path.join(tmp.name, "chinook.sqlite3");
  // copy chinook database to tmp directory
  await copyFile(CHINOOK_DATABASE_PATH, connString);
  const db = new Database(connString);
  const client = new SeedBetterSqlite3(db);
  return {
    client,
    name: connString,
    connectionString: connString,
  };
}
