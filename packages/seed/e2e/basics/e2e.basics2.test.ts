import { test as _test, type TestFunction, expect } from "vitest";
import { adapterEntries } from "#test/adapters.js";
import { setupProject } from "#test/setupProject.js";

for (const [dialect, adapter] of adapterEntries) {
  const computeName = (name: string) => `e2e > ${dialect} > ${name}`;
  const test = (name: string, fn: TestFunction) => {
    // eslint-disable-next-line vitest/expect-expect, vitest/valid-title
    _test.concurrent(computeName(name), fn);
  };

  test("seeds are unique per seed.<modelName> call", async () => {
    const { db } = await setupProject({
      adapter,
      databaseSchema: `
          create table users (
            id uuid not null primary key,
            confirmation_token text
          );

          create unique index confirmation_token_idx on users (confirmation_token);
        `,
      seedScript: `
      import { createSeedClient } from "#snaplet/seed"
      const seed = await createSeedClient()
      await seed.$resetDatabase()
      await seed.users([{}])
      await seed.users([{}])
    `,
    });

    const rows = await db.query('select * from "users"');
    expect(rows.length).toEqual(2);
  });

  test("table attributes (name, columns) contain spaces with inflection enabled", async () => {
    const { db } = await setupProject({
      adapter,
      databaseSchema: `
          create table "contracts " (
            id uuid not null primary key,
            "contract type" text not null
          );
          create table "yo lo" (
            id uuid not null primary key
          );
        `,
      seedScript: `
          import { createSeedClient } from "#snaplet/seed"
          const seed = await createSeedClient()
          await seed.$resetDatabase()
          await seed.contracts([{ contractType: "VIP" }])
          await seed.yoLos([{}])
        `,
    });

    const contracts = await db.query(`select * from "contracts "`);
    const yoLos = await db.query(`select * from "yo lo"`);
    expect(contracts).toEqual([
      expect.objectContaining({ "contract type": "VIP" }),
    ]);
    expect(yoLos.length).toEqual(1);
  });

  // TODO: support spaces when inflection is disabled
  _test.concurrent.skip(
    // eslint-disable-next-line vitest/valid-title
    computeName(
      "table attributes (name, columns) contain spaces with inflection disabled",
    ),
    async () => {
      const { db } = await setupProject({
        adapter,
        seedConfig: (connectionString) =>
          adapter.generateSeedConfig(connectionString, {
            alias: "{ inflection: false }",
          }),
        databaseSchema: `
          create table "contracts " (
            id uuid not null primary key,
            "contract type" text not null
          );
          create table "yo lo" (
            id uuid not null primary key
          );
        `,
        seedScript: `
          import { createSeedClient } from "#snaplet/seed"
          const seed = await createSeedClient()
          await seed.$resetDatabase()
          await seed["contracts "]([{ "contract type": "VIP" }])
          await seed["yo lo"]([{}])
        `,
      });

      const contracts = await db.query(`select * from "contracts "`);
      const yoLos = await db.query(`select * from "yo lo"`);
      expect(contracts).toEqual([
        expect.objectContaining({ "contract type": "VIP" }),
      ]);
      expect(yoLos.length).toEqual(1);
    },
  );

  test("null field overrides", async () => {
    const { db } = await setupProject({
      adapter,
      databaseSchema: `
        CREATE TABLE "Tmp" (
          "value" text
        );
      `,
      seedScript: `
        import { createSeedClient } from '#snaplet/seed'

        const seed = await createSeedClient({
          models: {
            tmps: {
              data: {
                value: null,
              }
            }
          }
        })

        await seed.tmps([{}])
      `,
    });

    expect(await db.query('select * from "Tmp"')).toEqual([{ value: null }]);
  });
}
