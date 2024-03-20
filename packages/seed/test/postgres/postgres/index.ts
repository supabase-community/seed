import { afterAll } from "vitest";
import { createSnapletTestDb, createTestDb } from "./createTestDatabase.js";
import { createTestRole } from "./createTestRole.js";

export const postgres = {
  createTestDb,
  createSnapletTestDb,
  createTestRole,
};

afterAll(async () => {
  await createTestRole.afterAll().catch((e: unknown) => {
    console.log(e);
  });
  await createTestDb.afterAll().catch((e: unknown) => {
    console.log(e);
  });
});
