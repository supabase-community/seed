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

    test.only("introspectDatabase should return detailed database structure", async () => {
      const structure = `
        CREATE TABLE Table1 (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255));
        CREATE TABLE Table2 (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), table1_id INT, FOREIGN KEY (table1_id) REFERENCES Table1(id));
      `;
      const db = await createTestDb(structure);
      const result = await introspectDatabase(db.client);
      console.log(JSON.stringify(result, null, 2));
      expect(result).toMatchObject({
        tables: [
          {
            name: "Table1",
            columns: [
              {
                id: `${db.name}.Table1.id`,
                schema: db.name,
                table: "Table1",
                name: "id",
                type: "int",
                nullable: false,
                constraints: ["PRIMARY KEY"],
              },
              {
                name: "name",
                type: "varchar(255)",
                nullable: true,
              },
            ],
          },
          {
            name: "Table2",
            columns: [
              {
                name: "id",
                type: "int",
                nullable: false,
                constraints: ["PRIMARY KEY"],
              },
              {
                name: "name",
                type: "varchar(255)",
                nullable: true,
              },
              {
                name: "table1_id",
                type: "int",
                nullable: true,
                constraints: ["FOREIGN KEY"],
              },
            ],
          },
        ],
      });
    });

    test("introspectDatabase - get parent relationships from structure", async () => {
      const db = await createSnapletTestDb();
      const structure = await introspectDatabase(db.client);
      const expectedAccessTokenParent: Relationship = {
        id: "AccessToken_userId_fkey",
        fkTable: "AccessToken",
        targetTable: "User",
        dirty: false,
        keys: [
          {
            fkColumn: "userId",
            type: "varchar(255)",
            nullable: false,
            targetColumn: "id",
          },
        ],
      };

      const actualAccessTokenParent = structure.tables.find(
        (t) => t.name === "AccessToken",
      )?.parents[0];

      expect(expectedAccessTokenParent).toEqual(actualAccessTokenParent);
    });

    test("introspectDatabase - get primary keys from structure", async () => {
      const db = await createSnapletTestDb();
      const structure = await introspectDatabase(db.client);

      const primaryKeys = structure.tables.find(
        (t) => t.name === "AccessToken",
      )?.primaryKeys;

      expect(primaryKeys).toMatchObject({
        keys: [{ name: "id", type: "varchar(255)" }],
      });
    });

    test("introspectDatabase - get child relationships from structure", async () => {
      const db = await createSnapletTestDb();
      const structure = await introspectDatabase(db.client);
      const expectedPricingPlanChild: Relationship = {
        id: "Organization_pricingPlanId_fkey",
        fkTable: "Organization",
        targetTable: "PricingPlan",
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

      expect(expectedPricingPlanChild).toEqual(actualPricingPlanChild);
    });
  },
);
