import { describe, expect, test } from "vitest";
import { SeedPostgres } from "#adapters/postgres/index.js";
import { postgres } from "#test";
import { fetchSchemas } from "./fetchSchemas.js";

const adapters = {
  postgres: () => postgres.postgres,
};

describe.each(["postgres"] as const)("fetchSchemas: %s", (adapter) => {
  const { createTestDb, createTestRole } = adapters[adapter]();
  test("should fetch only the public schema", async () => {
    const db = await createTestDb();
    const schemas = await fetchSchemas(db.client);
    expect(schemas).toEqual(["public"]);
  });
  test("should fetch all schemas where the user can read", async () => {
    const structure = `
    CREATE SCHEMA other;
    CREATE SCHEMA private;
  `;
    const db = await createTestDb(structure);
    const testRole = await createTestRole(db.client.client);
    await db.client.execute(
      `REVOKE ALL PRIVILEGES ON SCHEMA private FROM "${testRole.name}";
      GRANT ALL PRIVILEGES ON SCHEMA other TO "${testRole.name}";`,
    );
    const schemas = await fetchSchemas(new SeedPostgres(testRole.client));
    expect(schemas.length).toBe(2);
    expect(schemas).toEqual(expect.arrayContaining(["other", "public"]));
  });
});
