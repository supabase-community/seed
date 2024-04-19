import { describe, expect, test } from "vitest";
import { mysql } from "#test/mysql/mysql/index.js";
import { fetchSchemas } from "./fetchSchemas.js";

const adapters = {
  mysql: () => mysql,
};

describe.concurrent.each(["mysql"] as const)("fetchSchemas: %s", (adapter) => {
  const { createTestDb } = adapters[adapter]();
  // Isolated Database Test
  test("should fetch only the current database as schema in isolated database", async () => {
    const db = await createTestDb(`CREATE TABLE test_table (id INT);`);
    const schemas = await fetchSchemas(db.client);
    expect(schemas).toEqual([db.name]);
  });

  // Cross-Database Relationship Test
  test("should fetch all related databases including the current one in cross-database scenario", async () => {
    // Create the first database and table
    const db1 = await createTestDb(`
      CREATE TABLE table1Db1 (id INT PRIMARY KEY);
    `);
    const db2 = await createTestDb(`
      CREATE TABLE table2Db2 (id INT, ref_id INT, CONSTRAINT fk_to_db1 FOREIGN KEY (ref_id) REFERENCES \`${db1.name}\`.\`table1Db1\`(id));
    `);

    const schemas = await fetchSchemas(db1.client);
    const schema2 = await fetchSchemas(db2.client);
    // We should see the related database from both databases
    expect(schemas).toEqual(expect.arrayContaining([db1.name, db2.name]));
    expect(schema2).toEqual(expect.arrayContaining([db1.name, db2.name]));
  });
});
