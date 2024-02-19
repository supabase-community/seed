import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import { expect, test } from "vitest";
import { postgres } from "#test";
import { fetchSchemas } from "./fetchSchemas.js";

const { createTestDb, createTestRole } = postgres;

test("should fetch only the public schema", async () => {
  const db = await createTestDb();
  const schemas = await fetchSchemas(drizzle(db.client));
  expect(schemas).toEqual(["public"]);
});

test("should fetch all schemas where the user can read", async () => {
  const structure = `
    CREATE SCHEMA other;
    CREATE SCHEMA private;
  `;
  const db = await createTestDb(structure);
  const testRole = await createTestRole(db.client);
  const orm = drizzle(db.client);
  await orm.execute(
    sql.raw(`
    REVOKE ALL PRIVILEGES ON SCHEMA private FROM "${testRole.name}";
    GRANT ALL PRIVILEGES ON SCHEMA other TO "${testRole.name}";
  `),
  );
  const schemas = await fetchSchemas(drizzle(testRole.client));
  expect(schemas.length).toBe(2);
  expect(schemas).toEqual(expect.arrayContaining(["other", "public"]));
});
