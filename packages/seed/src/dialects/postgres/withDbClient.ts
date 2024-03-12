import { type WithDbClient } from "#core/dialect/types.js";
import { assertPackage } from "#core/utils.js";

export const withDbClient: WithDbClient = async ({ connectionString, fn }) => {
  await assertPackage("postgres");
  const { default: postgres } = await import("postgres");
  const client = postgres(connectionString, {
    max: 1,
  });
  try {
    const { drizzle } = await import("drizzle-orm/postgres-js");
    const db = drizzle(client);
    const { createDrizzleORMPgClient } = await import("./adapters.js");

    return await fn(createDrizzleORMPgClient(db));
  } finally {
    await client.end();
  }
};
