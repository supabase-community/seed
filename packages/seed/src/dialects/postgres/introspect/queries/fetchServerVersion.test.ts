import { drizzle } from "drizzle-orm/postgres-js";
import { expect, test } from "vitest";
import { postgres } from "#test";
import { fetchServerVersion } from "./fetchServerVersion.js";

const { createTestDb } = postgres;

test("should retrieve server version", async () => {
  const db = await createTestDb();
  const serverVersion = await fetchServerVersion(drizzle(db.client));
  expect(serverVersion).toMatch(/\d+\.\d+/);
});
