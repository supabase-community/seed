import { debug } from "debug";
import { afterAll } from "vitest";
import { createSnapletTestDb, createTestDb } from "./createTestDatabase.js";

export const mysql = {
  createTestDb,
  createSnapletTestDb,
};

const debugTest = debug("snaplet:test");

afterAll(async () => {
  await createTestDb.afterAll().catch((e: unknown) => {
    debugTest(e);
  });
});
