import { test as _test, type TestFunction, expect } from "vitest";
import { adapterEntries } from "#test/adapters.js";
import { setupProject } from "#test/setupProject.js";
import { type DialectRecordWithDefault } from "../../test/types.js";

for (const [dialect, adapter] of adapterEntries) {
  const computeName = (name: string) =>
    `e2e > transforms > ${dialect} > ${name}`;
  const test = (name: string, fn: TestFunction) => {
    // eslint-disable-next-line vitest/expect-expect, vitest/valid-title
    _test.concurrent(computeName(name), fn);
  };

  test("default database value with plan function override", async () => {
    const schema: DialectRecordWithDefault = {
      default: `
        create table team (
          id serial primary key,
          favorited INTEGER DEFAULT 42
        );
        `,
      sqlite: `
        -- Team table
        CREATE TABLE team (
          id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          favorited INTEGER DEFAULT 42
        );
        `,
    };

    // Ensure the adapter and dialect are correctly initialized or passed
    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
        import { createSeedClient } from '#snaplet/seed'
        const seed = await createSeedClient({
          dryRun: false,
        })
        await seed.teams((x) => x(2, () => ({ favorited: () => 1 })));
        `,
    });
    // Verify that the team table remains empty
    const teams = await db.query<{ favorited: boolean }>(
      'SELECT * FROM "team"',
    );
    expect(teams).toHaveLength(2);
    expect(teams.map((x) => x.favorited)).toEqual([1, 1]);
  });
  test("default database no override", async () => {
    const schema: DialectRecordWithDefault = {
      default: `
        create table team (
          id serial primary key,
          favorited INTEGER DEFAULT 42
        );
        `,
      sqlite: `
        -- Team table
        CREATE TABLE team (
          id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          favorited INTEGER DEFAULT 42
        );
        `,
    };

    // Ensure the adapter and dialect are correctly initialized or passed
    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
        import { createSeedClient } from '#snaplet/seed'
        const seed = await createSeedClient({
          dryRun: false,
        })
        await seed.teams((x) => x(2));
        `,
    });
    // Verify that the team table remains empty
    const teams = await db.query<{ favorited: boolean }>(
      'SELECT * FROM "team"',
    );
    expect(teams).toHaveLength(2);
    expect(teams.map((x) => x.favorited)).toEqual([42, 42]);
  });
}
