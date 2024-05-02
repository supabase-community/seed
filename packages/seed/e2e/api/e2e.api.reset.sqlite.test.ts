import { test as _test, type TestFunction } from "vitest";
import { type DialectId } from "#dialects/dialects.js";
import { adapterEntries } from "#test/adapters.js";
import { setupProject } from "#test/setupProject.js";

type DialectRecordWithDefault<T> = Partial<Record<DialectId, T>> &
  Record<"default", T>;
type SchemaRecord = DialectRecordWithDefault<string>;

for (const [dialect, adapter] of adapterEntries.filter(
  ([d]) => d === "sqlite",
)) {
  const computeName = (name: string) => `e2e > api > ${dialect} > ${name}`;
  const test = (name: string, fn: TestFunction) => {
    // eslint-disable-next-line vitest/expect-expect, vitest/valid-title
    _test.concurrent(computeName(name), fn);
  };

  test("seed.$resetDatabase should work on database withtout any sequence", async () => {
    const schema: SchemaRecord = {
      default: `
      CREATE TABLE \`transform_null_rows\` (
        \`id\` integer PRIMARY KEY NOT NULL,
        \`dates_id\` integer NOT NULL,
        \`users_id\` integer NOT NULL,
        \`merge_requests_id\` integer NOT NULL,
        \`repository_id\` integer NOT NULL,
        \`__created_at\` integer DEFAULT (strftime('%s', 'now')),
        \`__updated_at\` integer DEFAULT (strftime('%s', 'now'))
      );
      `,
    };
    const seedScript = `
    import { createSeedClient } from '#snaplet/seed'
    const seed = await createSeedClient()
    await seed.$resetDatabase()
    await seed.transformNullRows((x) => x(10));
  `;
    const { runSeedScript } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript,
    });
    // Should be able to re-run the seed script again thanks to the $resetDatabase
    await runSeedScript(seedScript);
  });
}
