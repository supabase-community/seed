import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzleJs } from "drizzle-orm/postgres-js";
import { describe, expect, test } from "vitest";
import { postgres } from "#test";
import { createDrizzleORMPgClient } from "../../adapters.js";
import { fetchEnums } from "./fetchEnums.js";

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

describe.each(["postgresJs", "pg"] as const)("fetchEnums: %s", (adapter) => {
  const { drizzle, createTestDb } = adapters[adapter]();
  test("should fetch basic enums", async () => {
    const structure = `
    CREATE TYPE public."enum_example" AS ENUM ('A', 'B', 'C');
  `;
    const db = await createTestDb(structure);

    const enums = await fetchEnums(
      // @ts-expect-error dynamic drizzle import based on adapter
      createDrizzleORMPgClient(drizzle(db.client)),
    );
    expect(enums).toEqual([
      {
        id: "public.enum_example",
        schema: "public",
        name: "enum_example",
        values: expect.arrayContaining(["A", "B", "C"]),
      },
    ]);
  });

  test("should fetch multiple enums", async () => {
    const structure = `
    CREATE TYPE public."enum_example1" AS ENUM ('A', 'B', 'C');
    CREATE TYPE public."enum_example2" AS ENUM ('D', 'E', 'F');
  `;
    const db = await createTestDb(structure);

    const enums = await fetchEnums(
      // @ts-expect-error dynamic drizzle import based on adapter
      createDrizzleORMPgClient(drizzle(db.client)),
    );
    expect(enums).toEqual(
      expect.arrayContaining([
        {
          id: "public.enum_example1",
          schema: "public",
          name: "enum_example1",
          values: expect.arrayContaining(["A", "B", "C"]),
        },
        {
          id: "public.enum_example2",
          schema: "public",
          name: "enum_example2",
          values: expect.arrayContaining(["D", "E", "F"]),
        },
      ]),
    );
  });

  test("should handle empty result when no accessible enums", async () => {
    const db = await createTestDb();

    const enums = await fetchEnums(
      // @ts-expect-error dynamic drizzle import based on adapter
      createDrizzleORMPgClient(drizzle(db.client)),
    );
    expect(enums).toEqual([]);
  });
});

describe.each(["postgresJs"] as const)("fetchEnums: %s", (adapter) => {
  const { drizzle, createTestDb, createTestRole } = adapters[adapter]();
  // pg adapter thrown a connection error withtthe createTestRole utils
  test("should not fetch enums on schemas the user does not have access to", async () => {
    const structure = `
    CREATE TYPE public."enum_example" AS ENUM ('A', 'B', 'C');
    CREATE SCHEMA private;
    CREATE TYPE private."enum_example_private" AS ENUM ('D', 'E', 'F');
  `;
    const db = await createTestDb(structure);
    const testRoleClient = await createTestRole(db.client);
    const enums = await fetchEnums(
      createDrizzleORMPgClient(drizzle(testRoleClient.client)),
    );
    expect(enums).toEqual(
      expect.arrayContaining([
        {
          id: "public.enum_example",
          schema: "public",
          name: "enum_example",
          values: expect.arrayContaining(["A", "B", "C"]),
        },
      ]),
    );
  });
});