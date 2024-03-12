import { type WithDbClient } from "#core/dialect/types.js";
import { assertPackage } from "#core/utils.js";

export const withDbClient: WithDbClient = async ({ connectionString, fn }) => {
  await assertPackage("better-sqlite3");
  const { default: Database } = await import("better-sqlite3");
  const client = new Database(new URL(connectionString).pathname, {
    fileMustExist: false,
  });
  try {
    const { drizzle } = await import("drizzle-orm/better-sqlite3");
    const db = drizzle(client);
    const { createDrizzleORMSqliteClient } = await import("./adapters.js");

    return await fn(createDrizzleORMSqliteClient(db));
  } finally {
    client.close();
  }
};
