import { describe, expect, test } from "vitest";
import { postgres } from "#test";
import { getDatamodel } from "./dataModel.js";

const adapters = {
  postgresJs: () => postgres.postgresJs,
};

describe.each(["postgresJs"] as const)("getDataModel: %s", (adapter) => {
  const { createTestDb } = adapters[adapter]();

  test("array types", async () => {
    const structure = `
    CREATE TABLE public."foo" (bar text[][]);
  `;
    const db = await createTestDb(structure);
    await db.client.run(`VACUUM ANALYZE;`);
    const result = await getDatamodel(db.client);
    expect(result.models["foo"].fields[0].type).toEqual("text[][]");
  });
});
