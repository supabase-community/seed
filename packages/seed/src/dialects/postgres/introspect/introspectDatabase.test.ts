import { drizzle as drizzleJs } from "drizzle-orm/postgres-js";
import { describe, expect, test } from "vitest";
import { postgres } from "#test";
import { createDrizzleORMPgClient } from "../adapters.js";
import { type Relationship, introspectDatabase } from "./introspectDatabase.js";

const adapters = {
  postgresJs: () => ({
    ...postgres.postgresJs,
    drizzle: drizzleJs,
  }),
};

describe.each(["postgresJs"] as const)(
  "fetchTablesAndColumns: %s",
  (adapter) => {
    const { drizzle, createTestDb, createSnapletTestDb, createTestRole } =
      adapters[adapter]();
    test("introspectDatabase should return detailed database structure", async () => {
      const structure = `
    CREATE SCHEMA test;
    CREATE TABLE test."Table1" (id serial PRIMARY KEY, name text);
    CREATE TABLE test."Table2" (id serial PRIMARY KEY, name text, table1_id integer REFERENCES test."Table1"(id));
    CREATE TYPE test."Enum1" AS ENUM ('A', 'B');
  `;
      const db = await createTestDb(structure);
      const orm = createDrizzleORMPgClient(drizzle(db.client));
      await orm.run(`VACUUM ANALYZE;`);
      const result = await introspectDatabase(orm);
      expect(result).toMatchObject({
        enums: [
          {
            id: "test.Enum1",
            name: "Enum1",
            schema: "test",
            values: ["A", "B"],
          },
        ],
        sequences: {
          test: [
            {
              current: 1,
              name: "Table1_id_seq",
              schema: "test",
              interval: 1,
            },
            {
              current: 1,
              name: "Table2_id_seq",
              schema: "test",
              interval: 1,
            },
          ],
        },
        tables: [
          {
            bytes: 0,
            partitioned: false,
            children: [
              {
                fkTable: "test.Table2",
                id: "Table2_table1_id_fkey",
                keys: [
                  {
                    fkColumn: "table1_id",
                    fkType: "int4",
                    nullable: true,
                    targetColumn: "id",
                    targetType: "int4",
                  },
                ],
                targetTable: "test.Table1",
              },
            ],
            columns: [
              {
                constraints: ["p"],
                default: "nextval('test.\"Table1_id_seq\"'::regclass)",
                generated: "NEVER",
                identity: null,
                id: "test.Table1.id",
                maxLength: null,
                name: "id",
                nullable: false,
                schema: "test",
                table: "Table1",
                type: "int4",
                typeCategory: "N",
                typeId: "pg_catalog.int4",
              },
              {
                constraints: [],
                default: null,
                generated: "NEVER",
                identity: null,
                id: "test.Table1.name",
                maxLength: null,
                name: "name",
                nullable: true,
                schema: "test",
                table: "Table1",
                type: "text",
                typeCategory: "S",
                typeId: "pg_catalog.text",
              },
            ],
            id: "test.Table1",
            name: "Table1",
            parents: [],
            primaryKeys: {
              dirty: false,
              keys: [
                {
                  name: "id",
                  type: "int4",
                },
              ],
              schema: "test",
              table: "Table1",
              tableId: "test.Table1",
            },
            rows: 0,
            schema: "test",
            uniqueConstraints: [
              {
                dirty: false,
                name: "Table1_pkey",
                schema: "test",
                table: "Table1",
                columns: ["id"],
              },
            ],
          },
          {
            bytes: 0,
            children: [],
            partitioned: false,
            columns: [
              {
                constraints: ["p"],
                default: "nextval('test.\"Table2_id_seq\"'::regclass)",
                generated: "NEVER",
                identity: null,
                id: "test.Table2.id",
                maxLength: null,
                name: "id",
                nullable: false,
                schema: "test",
                table: "Table2",
                type: "int4",
                typeCategory: "N",
                typeId: "pg_catalog.int4",
              },
              {
                constraints: [],
                default: null,
                generated: "NEVER",
                identity: null,
                id: "test.Table2.name",
                maxLength: null,
                name: "name",
                nullable: true,
                schema: "test",
                table: "Table2",
                type: "text",
                typeCategory: "S",
                typeId: "pg_catalog.text",
              },
              {
                constraints: ["f"],
                default: null,
                generated: "NEVER",
                identity: null,
                id: "test.Table2.table1_id",
                maxLength: null,
                name: "table1_id",
                nullable: true,
                schema: "test",
                table: "Table2",
                type: "int4",
                typeCategory: "N",
                typeId: "pg_catalog.int4",
              },
            ],
            id: "test.Table2",
            name: "Table2",
            parents: [
              {
                fkTable: "test.Table2",
                id: "Table2_table1_id_fkey",
                keys: [
                  {
                    fkColumn: "table1_id",
                    fkType: "int4",
                    nullable: true,
                    targetColumn: "id",
                    targetType: "int4",
                  },
                ],
                targetTable: "test.Table1",
              },
            ],
            primaryKeys: {
              dirty: false,
              keys: [
                {
                  name: "id",
                  type: "int4",
                },
              ],
              schema: "test",
              table: "Table2",
              tableId: "test.Table2",
            },
            uniqueConstraints: [
              {
                dirty: false,
                name: "Table2_pkey",
                schema: "test",
                table: "Table2",
                columns: ["id"],
              },
            ],
            rows: 0,
            schema: "test",
          },
        ],
      });
    });

    test("introspectDatabase - get parent relationships from structure", async () => {
      const db = await createSnapletTestDb();
      const orm = createDrizzleORMPgClient(drizzle(db.client));
      const structure = await introspectDatabase(orm);
      const expectedAccessTokenParent: Relationship = {
        id: "AccessToken_userId_fkey",
        fkTable: "public.AccessToken",
        targetTable: "public.User",

        keys: [
          {
            fkColumn: "userId",
            fkType: "text",
            nullable: false,
            targetColumn: "id",
            targetType: "text",
          },
        ],
      };

      const actualAccessTokenParent = structure.tables.find(
        (t) => t.id == "public.AccessToken",
      )?.parents[0];

      expect(expectedAccessTokenParent).toEqual(actualAccessTokenParent);
    });

    test("introspectDatabase - get primary keys from structure", async () => {
      const db = await createSnapletTestDb();
      const orm = createDrizzleORMPgClient(drizzle(db.client));
      const structure = await introspectDatabase(orm);

      const primaryKeys = structure.tables.find(
        (t) => t.id == "public.AccessToken",
      )?.primaryKeys;

      expect(primaryKeys).toEqual({
        keys: [{ name: "id", type: "text" }],
        dirty: false,
        schema: "public",
        table: "AccessToken",
        tableId: "public.AccessToken",
      });
    });

    test("introspectDatabase - get child relationships from structure", async () => {
      const db = await createSnapletTestDb();
      const orm = createDrizzleORMPgClient(drizzle(db.client));
      const structure = await introspectDatabase(orm);
      const expectedPricingPlanChild: Relationship = {
        id: "Organization_pricingPlanId_fkey",
        fkTable: "public.Organization",
        targetTable: "public.PricingPlan",

        keys: [
          {
            fkColumn: "pricingPlanId",
            fkType: "int4",
            nullable: true,
            targetColumn: "id",
            targetType: "int4",
          },
        ],
      };

      const actualPricingPlanChild = structure.tables.find(
        (t) => t.id == "public.PricingPlan",
      )?.children[0];

      expect(expectedPricingPlanChild).toEqual(actualPricingPlanChild);
    });
    test("partitions of a partitioned table should not be present in the introspection result", async () => {
      // arrange
      const db = await createTestDb();
      const orm = createDrizzleORMPgClient(drizzle(db.client));
      await orm.run(`
    CREATE TABLE coach(id uuid primary key);
    CREATE TABLE exercise (id uuid, coach_id uuid REFERENCES coach(id)) PARTITION BY list(coach_id);
    CREATE TABLE exercise1 PARTITION OF exercise FOR VALUES IN (NULL);
    CREATE TABLE exercise2 PARTITION OF exercise DEFAULT;
  `);
      await orm.run(`VACUUM ANALYZE;`);
      // act
      const structure = await introspectDatabase(orm);

      // assert
      expect(
        structure.tables.find((t) => t.id === "public.coach"),
      ).toMatchObject({
        partitioned: false,
      });
      expect(
        structure.tables.find((t) => t.id === "public.exercise"),
      ).toMatchObject({ partitioned: true });
      const stringifiedStructure = JSON.stringify(structure);
      expect(stringifiedStructure).toContain("exercise");
      expect(stringifiedStructure).not.toContain("exercise1");
      expect(stringifiedStructure).not.toContain("exercise2");
    });
    test("introspect with tables and schemas the user cannot access", async () => {
      const db = await createTestDb();
      const restrictedString = await createTestRole(db.client);
      const otherString = await createTestRole(db.client);
      const orm = createDrizzleORMPgClient(drizzle(db.client));

      await orm.run(`
    CREATE TABLE "public"."table1" ("value" text);
    GRANT SELECT ON TABLE "public"."table1" TO "${restrictedString.name}";
    CREATE TABLE "public"."table2" ("value" text);
    CREATE SCHEMA "someSchema" AUTHORIZATION "${otherString.name}";
    CREATE TABLE "someSchema"."table3" ("value" text);
  `);
      const structure = await introspectDatabase(
        createDrizzleORMPgClient(drizzle(restrictedString.client)),
      );

      expect(structure).toEqual(
        expect.objectContaining({
          tables: [
            expect.objectContaining({
              schema: "public",
              name: "table1",
            }),
          ],
        }),
      );
    });

    test("Read primary keys with readaccess permissions", async () => {
      const structure = `
    CREATE TABLE public."Member" (id serial PRIMARY KEY, name text);
  `;
      const db = await createTestDb(structure);
      const orm = createDrizzleORMPgClient(drizzle(db.client));
      const readAccessConnString = await createTestRole(db.client);
      await orm.run(`
    DROP ROLE IF EXISTS readaccess;
    CREATE ROLE readaccess;
    GRANT CONNECT ON DATABASE "${db.name}" TO readaccess;
    GRANT USAGE ON SCHEMA public TO readaccess;
    GRANT SELECT ON ALL TABLES IN SCHEMA public TO readaccess;
    GRANT readaccess TO "${readAccessConnString.name}";
  `);
      await orm.run(`VACUUM ANALYZE;`);
      const result = await introspectDatabase(orm);

      const member = result.tables.find((t) => t.id == "public.Member");
      console.log(
        member?.columns.filter((c) => c.constraints.some((c) => c == "p")),
      );
      expect(member?.primaryKeys?.keys).toEqual([{ name: "id", type: "int4" }]);
    });
  },
);
