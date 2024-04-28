import { describe, expect, test } from "vitest";
import { mysql } from "#test/mysql/mysql/index.js";
import { type Relationship, introspectDatabase } from "./introspectDatabase.js";

const adapters = {
  mysql: () => mysql,
};
describe.concurrent.each(["mysql"] as const)(
  "introspectDatabase: %s",
  (adapter) => {
    const { createTestDb, createSnapletTestDb } = adapters[adapter]();

    test("introspectDatabase should return detailed database structure", async () => {
      const structure = `
        CREATE TABLE Table1 (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255));
        CREATE TABLE Table2 (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255),
          status ENUM('A', 'B'),
          table1_id INT,
          FOREIGN KEY (table1_id) REFERENCES Table1(id));
      `;
      const db = await createTestDb(structure);
      const result = await introspectDatabase(db.client);
      expect(result).toMatchObject({
        enums: [
          {
            id: `${db.name}.Table2.status`,
            schema: db.name,
            name: "status",
            values: ["A", "B"],
          },
        ],
        sequences: {
          [db.name]: [
            {
              columnName: "id",
              tableId: `${db.name}.Table1`,
              current: 1,
              interval: 1,
              name: `${db.name}.Table1.id`,
              schema: db.name,
              start: 1,
            },
            {
              columnName: "id",
              tableId: `${db.name}.Table2`,
              current: 1,
              interval: 1,
              name: `${db.name}.Table2.id`,
              schema: db.name,
              start: 1,
            },
          ],
        },
        tables: expect.arrayContaining([
          {
            id: `${db.name}.Table1`,
            name: "Table1",
            schema: db.name,
            columns: [
              {
                id: `${db.name}.Table1.id`,
                schema: db.name,
                table: "Table1",
                name: "id",
                type: "int",
                nullable: false,
                maxLength: null,
                default: null,
                constraints: ["p"],
                generated: false,
                identity: {
                  current: 1,
                  name: `${db.name}.Table1.id`,
                },
              },
              {
                id: `${db.name}.Table1.name`,
                schema: db.name,
                table: "Table1",
                name: "name",
                type: "varchar",
                generated: false,
                nullable: true,
                maxLength: 255,
                default: null,
                constraints: [],
                identity: null,
              },
            ],
            parents: [],
            children: [
              {
                id: expect.any(String),
                fkTable: `${db.name}.Table2`,
                targetTable: `${db.name}.Table1`,
                dirty: false,
                keys: [
                  {
                    fkColumn: "table1_id",
                    type: "int",
                    nullable: true,
                    targetColumn: "id",
                  },
                ],
              },
            ],
            primaryKeys: {
              dirty: false,
              keys: [{ name: "id", type: "int" }],
              schema: db.name,
              table: "Table1",
              tableId: `${db.name}.Table1`,
            },
            uniqueConstraints: [
              {
                name: `${db.name}.Table1.id`,
                dirty: false,
                schema: db.name,
                table: "Table1",
                columns: ["id"],
                tableId: `${db.name}.Table1`,
              },
            ],
          },
          {
            id: `${db.name}.Table2`,
            name: "Table2",
            schema: db.name,
            columns: [
              {
                id: `${db.name}.Table2.id`,
                schema: db.name,
                table: "Table2",
                name: "id",
                type: "int",
                nullable: false,
                generated: false,
                maxLength: null,
                default: null,
                constraints: ["p"],
                identity: {
                  current: 1,
                  name: `${db.name}.Table2.id`,
                },
              },
              {
                id: `${db.name}.Table2.name`,
                schema: db.name,
                table: "Table2",
                name: "name",
                type: "varchar",
                nullable: true,
                generated: false,
                maxLength: 255,
                default: null,
                constraints: [],
                identity: null,
              },
              {
                id: `${db.name}.Table2.status`,
                schema: db.name,
                table: "Table2",
                name: "status",
                type: `enum.${db.name}.Table2.status`,
                nullable: true,
                generated: false,
                maxLength: 1,
                default: null,
                constraints: [],
                identity: null,
              },
              {
                id: `${db.name}.Table2.table1_id`,
                schema: db.name,
                table: "Table2",
                name: "table1_id",
                type: "int",
                nullable: true,
                generated: false,
                maxLength: null,
                default: null,
                constraints: ["f"],
                identity: null,
              },
            ],
            parents: [
              {
                id: expect.any(String),
                fkTable: `${db.name}.Table2`,
                targetTable: `${db.name}.Table1`,
                dirty: false,
                keys: [
                  {
                    fkColumn: "table1_id",
                    type: "int",
                    nullable: true,
                    targetColumn: "id",
                  },
                ],
              },
            ],
            children: [],
            primaryKeys: {
              dirty: false,
              keys: [{ name: "id", type: "int" }],
              schema: db.name,
              table: "Table2",
              tableId: `${db.name}.Table2`,
            },
            uniqueConstraints: [
              {
                name: `${db.name}.Table2.id`,
                dirty: false,
                schema: db.name,
                table: "Table2",
                columns: ["id"],
                tableId: `${db.name}.Table2`,
              },
            ],
          },
        ]),
      });
    });

    test("introspectDatabase - get parent relationships from structure", async () => {
      const db = await createSnapletTestDb();
      const structure = await introspectDatabase(db.client);
      // console.log(JSON.stringify(structure.tables, null, 2));
      const expectedAccessTokenParent: Relationship = {
        id: "AccessToken_userId_fkey",
        fkTable: `${db.name}.AccessToken`,
        targetTable: `${db.name}.User`,
        dirty: false,
        keys: [
          {
            fkColumn: "userId",
            type: "varchar",
            nullable: false,
            targetColumn: "id",
          },
        ],
      };

      const actualAccessTokenParent = structure.tables.find(
        (t) => t.name === "AccessToken",
      )?.parents[0];

      expect(actualAccessTokenParent).toEqual(expectedAccessTokenParent);
    });

    test("introspectDatabase - get primary keys from structure", async () => {
      const db = await createSnapletTestDb();
      const structure = await introspectDatabase(db.client);

      const primaryKeys = structure.tables.find(
        (t) => t.name === "AccessToken",
      )?.primaryKeys;

      expect(primaryKeys).toMatchObject({
        keys: [{ name: "id", type: "varchar" }],
      });
    });

    test("introspectDatabase - get child relationships from structure", async () => {
      const db = await createSnapletTestDb();
      const structure = await introspectDatabase(db.client);
      const expectedPricingPlanChild: Relationship = {
        id: "Organization_pricingPlanId_fkey",
        fkTable: `${db.name}.Organization`,
        targetTable: `${db.name}.PricingPlan`,
        dirty: false,
        keys: [
          {
            fkColumn: "pricingPlanId",
            type: "int",
            nullable: true,
            targetColumn: "id",
          },
        ],
      };

      const actualPricingPlanChild = structure.tables
        .find((t) => t.name === "PricingPlan")
        ?.children.find((c) => c.id === "Organization_pricingPlanId_fkey");

      expect(actualPricingPlanChild).toEqual(expectedPricingPlanChild);
    });
  },
);
