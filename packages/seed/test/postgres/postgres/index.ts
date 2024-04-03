import { debug } from "debug";
import { afterAll } from "vitest";
import { createSnapletTestDb, createTestDb } from "./createTestDatabase.js";
import { createTestRole } from "./createTestRole.js";

export const postgres = {
  createTestDb,
  createSnapletTestDb,
  createTestRole,
};

const debugTest = debug("snaplet:test");

afterAll(async () => {
  await createTestRole.afterAll().catch((e: unknown) => {
    debugTest(e);
  });
  await createTestDb.afterAll().catch((e: unknown) => {
    debugTest(e);
  });
});
