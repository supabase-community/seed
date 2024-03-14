import { drizzle as drizzleJs } from "drizzle-orm/postgres-js";
import { describe, expect, test } from "vitest";
import { postgres } from "#test";
import { createDrizzleORMPostgresClient } from "./adapters.js";
import { getDatamodel } from "./dataModel.js";

const adapters = {
  postgresJs: () => ({
    ...postgres.postgresJs,
    drizzle: drizzleJs,
  }),
};

describe.each(["postgresJs"] as const)("getDataModel: %s", (adapter) => {
  const { drizzle, createTestDb } = adapters[adapter]();

  test("array types", async () => {
    const structure = `
    CREATE TABLE public."foo" (bar text[][]);
  `;
    const db = await createTestDb(structure);
    const orm = createDrizzleORMPostgresClient(drizzle(db.client));
    await orm.run(`VACUUM ANALYZE;`);
    const result = await getDatamodel(orm);
    expect(result.models["foo"].fields[0].type).toEqual("text[][]");
  });
});
