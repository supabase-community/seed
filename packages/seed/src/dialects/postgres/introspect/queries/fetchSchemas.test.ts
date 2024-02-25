import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzleJs } from "drizzle-orm/postgres-js";
import { describe, expect, test } from "vitest";
import { postgres } from "#test";
import { createDrizzleORMPgClient } from "../../adapters.js";
import { fetchSchemas } from "./fetchSchemas.js";

const adapters = {
  postgresJs: () => ({
    ...postgres.postgresJs,
    drizzle: drizzleJs,
  }),
  pg: () => ({
    ...postgres.pg,
    drizzle: drizzlePg,
  }),
};

describe.each(["postgresJs", "pg"] as const)("fetchSchemas: %s", (adapter) => {
  const { drizzle, createTestDb, createTestRole } = adapters[adapter]();
  test("should fetch only the public schema", async () => {
    const db = await createTestDb();
    const schemas = await fetchSchemas(
      // @ts-expect-error dynamic drizzle import based on adapter
      createDrizzleORMPgClient(drizzle(db.client)),
    );
    expect(schemas).toEqual(["public"]);
  });

  test("should fetch all schemas where the user can read", async () => {
    const structure = `
    CREATE SCHEMA other;
    CREATE SCHEMA private;
  `;
    const db = await createTestDb(structure);
    const testRole = await createTestRole(db.client);
    // @ts-expect-error dynamic drizzle import based on adapter
    const orm = createDrizzleORMPgClient(drizzle(db.client));
    await orm.run(
      `
    REVOKE ALL PRIVILEGES ON SCHEMA private FROM "${testRole.name}";
    GRANT ALL PRIVILEGES ON SCHEMA other TO "${testRole.name}";
  `,
    );
    const schemas = await fetchSchemas(
      // @ts-expect-error dynamic drizzle import based on adapter
      createDrizzleORMPgClient(drizzle(testRole.client)),
    );
    expect(schemas.length).toBe(2);
    expect(schemas).toEqual(expect.arrayContaining(["other", "public"]));
  });
});
