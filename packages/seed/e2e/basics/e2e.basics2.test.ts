import { test as _test, type TestFunction, expect } from "vitest";
import { type DialectId } from "#dialects/dialects.js";
import { adapterEntries } from "#test/adapters.js";
import { setupProject } from "#test/setupProject.js";

type DialectRecordWithDefault<T> = Partial<Record<DialectId, T>> &
  Record<"default", T>;
type SchemaRecord = DialectRecordWithDefault<string>;

for (const [dialect, adapter] of adapterEntries) {
  const computeName = (name: string) => `e2e > ${dialect} > ${name}`;
  const test = (name: string, fn: TestFunction) => {
    // eslint-disable-next-line vitest/expect-expect, vitest/valid-title
    _test.concurrent(computeName(name), fn);
  };

  test("seeds are unique per seed.<modelName> call", async () => {
    const schema: SchemaRecord = {
      default: `
          CREATE TABLE users (
            id UUID NOT NULL PRIMARY KEY,
            confirmation_token TEXT
          );
          CREATE UNIQUE INDEX confirmation_token_idx ON users (confirmation_token);
        `,
      mysql: `
          CREATE TABLE users (
            id CHAR(36) NOT NULL PRIMARY KEY DEFAULT (uuid()),
            confirmation_token VARCHAR(255),
            UNIQUE INDEX confirmation_token_idx (confirmation_token)
          );
        `,
    };

    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
      import { createSeedClient } from "#snaplet/seed"
      const seed = await createSeedClient()
      await seed.$resetDatabase()
      await seed.users([{}])
      await seed.users([{}])
    `,
    });

    // Make sure to use the correct SQL query syntax for MySQL
    const rows = await db.query("SELECT * FROM users");
    expect(rows.length).toEqual(2);
  });

  test("table attributes (name, columns) contain spaces with inflection enabled", async () => {
    const schemas: SchemaRecord = {
      default: `
        CREATE TABLE ${adapter.escapeIdentifier("contracts ")} (
          id UUID NOT NULL PRIMARY KEY,
          "contract type" TEXT NOT NULL
        );
        CREATE TABLE ${adapter.escapeIdentifier("yo lo")} (
          id UUID NOT NULL PRIMARY KEY
        );
      `,
      mysql: `
        CREATE TABLE ${adapter.escapeIdentifier("contracts")} (
          id CHAR(36) NOT NULL PRIMARY KEY,
          ${adapter.escapeIdentifier("contract type")} VARCHAR(255) NOT NULL
        );
        CREATE TABLE ${adapter.escapeIdentifier("yo lo")} (
          id CHAR(36) NOT NULL PRIMARY KEY
        );`,
    };
    const { db } = await setupProject({
      adapter,
      databaseSchema: schemas[dialect] ?? schemas.default,
      seedScript: `
          import { createSeedClient } from "#snaplet/seed"
          const seed = await createSeedClient()
          await seed.$resetDatabase()
          await seed.contracts([{ contractType: "VIP" }])
          await seed.yoLos([{}])
        `,
    });

    const contracts = await db.query(
      // Trailing whitespace in mysql is invalid syntax
      `select * from ${adapter.escapeIdentifier(dialect === "mysql" ? "contracts" : "contracts ")}`,
    );
    const yoLos = await db.query(
      `select * from ${adapter.escapeIdentifier("yo lo")}`,
    );
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
    const schema: SchemaRecord = {
      default: `
        CREATE TABLE Tmp (
          value TEXT
        );
      `,
      mysql: `
        CREATE TABLE Tmp (
          value TEXT
        );
      `,
    };
    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
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

    // The SQL query syntax below is neutral and should work for both PostgreSQL and MySQL.
    expect(await db.query("SELECT * FROM Tmp")).toEqual([{ value: null }]);
  });
}
