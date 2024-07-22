import { test as _test, type TestFunction, expect } from "vitest";
import { adapterEntries } from "#test/adapters.js";
import { setupProject } from "#test/setupProject.js";
import { type DialectRecordWithDefault } from "#test/types.js";

for (const [dialect, adapter] of adapterEntries.filter(
  ([d]) => d === "postgres",
)) {
  const computeName = (name: string) => `e2e > shapes > ${dialect} > ${name}`;
  const test = (name: string, fn: TestFunction) => {
    // eslint-disable-next-line vitest/expect-expect, vitest/valid-title
    _test.concurrent(computeName(name), fn);
  };

  test("db's without any inputs to predict", async () => {
    const schema: DialectRecordWithDefault = {
      default: `
        CREATE TABLE users (
          id SERIAL PRIMARY KEY
        );
      `,
      sqlite: `
        CREATE TABLE users (
          id INTEGER PRIMARY KEY AUTOINCREMENT
        );
      `,
      mysql: `
        CREATE TABLE users (
          id INT AUTO_INCREMENT PRIMARY KEY
        );
      `,
    };
    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
          import { createSeedClient } from '#snaplet/seed'
          const seed = await createSeedClient()
          await seed.users((x) => x(2))
        `,
    });

    const users = await db.query<{ id: number }>("SELECT * FROM users");
    expect(users).toHaveLength(2);
  });

  if (dialect !== "sqlite") {
    test("handles array fields", async () => {
      const { db } = await setupProject({
        adapter,
        databaseSchema: `
            CREATE TABLE "Tmp" (
              "values" text[] NOT NULL
            );
          `,
        seedScript: `
            import { createSeedClient } from '#snaplet/seed'

            const seed = await createSeedClient()
            await seed.tmps((x) => x(2));
          `,
      });

      expect(await db.query('SELECT * from "Tmp"')).toEqual([
        {
          values: ["Foo Bar"],
        },
        {
          values: ["Foo Bar"],
        },
      ]);
    });
  }
}
