import { afterEach } from "vitest";
import { createTestDb } from "./createTestDatabase.js";
import { createTestRole } from "./createTestRole.js";

export { createTestDb, createSnapletTestDb } from "./createTestDatabase.js";
export { createTestRole } from "./createTestRole.js";

afterEach(async () => {
  await createTestRole.afterEach().catch(console.log);
  await createTestDb.afterEach().catch(console.log);
});
