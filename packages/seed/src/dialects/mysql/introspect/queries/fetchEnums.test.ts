import { describe, expect, test } from "vitest";
import { mysql } from "#test/mysql/mysql/index.js";
import { fetchEnums } from "./fetchEnums.js";

const adapters = {
  mysql: () => mysql,
};

describe.concurrent.each(["mysql"] as const)("fetchEnums: %s", (adapter) => {
  const { createTestDb } = adapters[adapter]();

  test("should fetch basic enums", async () => {
    const structure = `
      CREATE TABLE test_table (
        id INT,
        status ENUM('A', 'B', 'C')
      );
    `;
    const db = await createTestDb(structure);

    const schemas = [db.name];
    const enums = await fetchEnums(db.client, schemas);
    expect(enums).toEqual([
      {
        id: `${db.name}.status`,
        schema: db.name,
        name: "status",
        values: expect.arrayContaining(["A", "B", "C"]),
      },
    ]);
  });

  test("should fetch multiple enums", async () => {
    const structure = `
      CREATE TABLE test_table1 (
        id INT,
        status1 ENUM('A', 'B', 'C')
      );
      CREATE TABLE test_table2 (
        id INT,
        status2 ENUM('D', 'E', 'F')
      );
    `;
    const db = await createTestDb(structure);

    const schemas = [db.name];
    const enums = await fetchEnums(db.client, schemas);
    expect(enums).toEqual(
      expect.arrayContaining([
        {
          id: `${db.name}.status1`,
          schema: db.name,
          name: "status1",
          values: expect.arrayContaining(["A", "B", "C"]),
        },
        {
          id: `${db.name}.status2`,
          schema: db.name,
          name: "status2",
          values: expect.arrayContaining(["D", "E", "F"]),
        },
      ]),
    );
  });

  test("should handle empty result when no accessible enums", async () => {
    const db = await createTestDb();
    const schemas = [db.name];
    const enums = await fetchEnums(db.client, schemas);
    expect(enums).toEqual([]);
  });
});
