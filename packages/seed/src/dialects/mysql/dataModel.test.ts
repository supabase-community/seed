import { describe, expect, test } from "vitest";
import { postgres } from "#test/postgres/postgres/index.js";
import { getDatamodel } from "./dataModel.js";

const adapters = {
  postgres: () => postgres,
};

describe.concurrent.each(["postgres"] as const)(
  "getDataModel: %s",
  (adapter) => {
    const { createTestDb } = adapters[adapter]();

    test("array types", async () => {
      const structure = `
    CREATE TABLE public."foo" (bar text[][]);
  `;
      const db = await createTestDb(structure);
      await db.client.execute(`VACUUM ANALYZE;`);
      const result = await getDatamodel(db.client);
      expect(result.models["foo"].fields[0].type).toEqual("text[][]");
    });
  },
);
