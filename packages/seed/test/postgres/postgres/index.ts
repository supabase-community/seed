import { afterAll } from "vitest";
import { createTestDb } from "./createTestDatabase.js";
import { createTestRole } from "./createTestRole.js";

export { createSnapletTestDb, createTestDb } from "./createTestDatabase.js";
export { createTestRole } from "./createTestRole.js";

afterAll(async () => {
  await createTestRole.afterAll().catch((e: unknown) => {
    console.log(e);
  });
  await createTestDb.afterAll().catch((e: unknown) => {
    console.log(e);
  });
});
