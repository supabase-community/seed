import { describe, expect, test } from "vitest";
import { mysql } from "#test/mysql/mysql/index.js";
import { fetchSchemas } from "./fetchSchemas.js";

const adapters = {
  mysql: () => mysql,
};

describe.concurrent.each(["mysql"] as const)("fetchSchemas: %s", (adapter) => {
  const { createTestDb } = adapters[adapter]();
  test("should fetch only the mysql schema", async () => {
    const db = await createTestDb(`CREATE TABLE test_table (id INT)`);
    const schemas = await fetchSchemas(db.client);
    expect(schemas).toEqual(["mysql"]);
  });
});
