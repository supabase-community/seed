import { test as _test, type TestFunction, expect } from "vitest";
import { type DialectId } from "#dialects/dialects.js";
import { adapterEntries } from "#test/adapters.js";
import { setupProject } from "#test/setupProject.js";

type DialectRecordWithDefault<T> = Partial<Record<DialectId, T>> &
  Record<"default", T>;
type SchemaRecord = DialectRecordWithDefault<string>;
type SeedConfigRecord = DialectRecordWithDefault<
  (connectionString: string) => string
>;

for (const [dialect, adapter] of adapterEntries) {
  const computeName = (name: string) => `e2e > api > ${dialect} > ${name}`;
  const test = (name: string, fn: TestFunction) => {
    // eslint-disable-next-line vitest/expect-expect, vitest/valid-title
    _test.concurrent(computeName(name), fn);
  };

  test("seed.<model> supports async column generate callbacks", async () => {
    const schema: SchemaRecord = {
      default: `
        CREATE TABLE ${adapter.escapeIdentifier("User")} (
          "id" UUID NOT NULL,
          ${adapter.escapeIdentifier("fullName")} TEXT NOT NULL
        );
      `,
      mysql: `
        CREATE TABLE ${adapter.escapeIdentifier("User")} (
          id CHAR(36) NOT NULL,
          ${adapter.escapeIdentifier("fullName")} VARCHAR(255) NOT NULL,
          PRIMARY KEY (id)
        );
      `,
    };
    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
        import { createSeedClient } from '#snaplet/seed'
        const seed = await createSeedClient()
        await seed.users([{
          fullName: () => Promise.resolve('Foo Bar')
        }])
      `,
    });

    const [{ fullName }] = await db.query<{ fullName: string }>(
      `select * from ${adapter.escapeIdentifier("User")}`,
    );

    expect(fullName).toEqual("Foo Bar");
  });

  test("seed.$resetDatabase should reset all tables per default", async () => {
    const schema: SchemaRecord = {
      default: `
          CREATE TABLE ${adapter.escapeIdentifier("Team")} (
            "id" SERIAL PRIMARY KEY
          );
          CREATE TABLE ${adapter.escapeIdentifier("Player")} (
            "id" BIGSERIAL PRIMARY KEY,
            ${adapter.escapeIdentifier("teamId")} integer NOT NULL REFERENCES ${adapter.escapeIdentifier("Team")}(id),
            "name" text NOT NULL
          );
          CREATE TABLE ${adapter.escapeIdentifier("Game")} (
            "id" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY
          );
        `,
      sqlite: `
          CREATE TABLE ${adapter.escapeIdentifier("Team")} (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT
          );
          CREATE TABLE ${adapter.escapeIdentifier("Player")} (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            ${adapter.escapeIdentifier("teamId")} integer NOT NULL REFERENCES ${adapter.escapeIdentifier("Team")}(id),
            "name" text NOT NULL
          );
          CREATE TABLE ${adapter.escapeIdentifier("Game")} (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT
          );
        `,
      mysql: `
          CREATE TABLE ${adapter.escapeIdentifier("Team")} (
            id INT AUTO_INCREMENT PRIMARY KEY
          );
          CREATE TABLE ${adapter.escapeIdentifier("Player")} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ${adapter.escapeIdentifier("teamId")} INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            FOREIGN KEY (${adapter.escapeIdentifier("teamId")}) REFERENCES ${adapter.escapeIdentifier("Team")}(id)
          );
          CREATE TABLE ${adapter.escapeIdentifier("Game")} (
            id INT AUTO_INCREMENT PRIMARY KEY
          );
        `,
    };

    const seedScript = `
    import { createSeedClient } from '#snaplet/seed'
    const seed = await createSeedClient()
    await seed.$resetDatabase()
    await seed.teams((x) => x(2, {
      players: (x) => x(3)
    }));
    await seed.games((x) => x(3));
  `;
    const { db, runSeedScript } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript,
    });
    expect(
      (await db.query(`SELECT * FROM ${adapter.escapeIdentifier("Player")}`))
        .length,
    ).toEqual(6);
    expect(
      (await db.query(`SELECT * FROM ${adapter.escapeIdentifier("Team")}`))
        .length,
    ).toEqual(2);
    expect(
      (await db.query(`SELECT * FROM ${adapter.escapeIdentifier("Game")}`))
        .length,
    ).toEqual(3);
    // Should be able to re-run the seed script again thanks to the $resetDatabase
    await runSeedScript(seedScript);
    expect(
      (await db.query(`SELECT * FROM ${adapter.escapeIdentifier("Player")}`))
        .length,
    ).toEqual(6);
    expect(
      (await db.query(`SELECT * FROM ${adapter.escapeIdentifier("Team")}`))
        .length,
    ).toEqual(2);
    expect(
      (await db.query(`SELECT * FROM ${adapter.escapeIdentifier("Game")}`))
        .length,
    ).toEqual(3);
  });

  test("seed.$resetDatabase should not reset config excluded table", async () => {
    const schema: SchemaRecord = {
      default: `
          CREATE TABLE "BABBA" (
            "id" SERIAL PRIMARY KEY
          );
          CREATE TABLE "BABA" (
            "id" SERIAL PRIMARY KEY
          );
        `,
      sqlite: `
          CREATE TABLE "BABBA" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT
          );
          CREATE TABLE "BABA" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT
          );
        `,
      mysql: `
          CREATE TABLE \`BABBA\` (
            id INT AUTO_INCREMENT PRIMARY KEY
          );
          CREATE TABLE \`BABA\` (
            id INT AUTO_INCREMENT PRIMARY KEY
          );
        `,
    };

    const seedConfig: SeedConfigRecord = {
      default: (connectionString) =>
        adapter.generateSeedConfig(connectionString, {
          select: `["!BABA"]`,
        }),
      postgres: (connectionString) =>
        adapter.generateSeedConfig(connectionString, {
          select: `["!public.BABA"]`,
        }),
      mysql: (connectionString) =>
        adapter.generateSeedConfig(connectionString, {
          select: `["!*.BABA"]`,
        }),
    };

    const { db, runSeedScript } = await setupProject({
      adapter,
      seedConfig: seedConfig[dialect] ?? seedConfig.default,
      databaseSchema: schema[dialect] ?? schema.default,
    });

    await db.execute(
      `INSERT INTO ${adapter.escapeIdentifier("BABBA")} VALUES (1)`,
    );
    await db.execute(
      `INSERT INTO ${adapter.escapeIdentifier("BABBA")} VALUES (2)`,
    );

    await db.execute(
      `INSERT INTO ${adapter.escapeIdentifier("BABA")} VALUES (3)`,
    );
    await db.execute(
      `INSERT INTO ${adapter.escapeIdentifier("BABA")} VALUES (4)`,
    );

    await runSeedScript(`
        import { createSeedClient } from '#snaplet/seed'

        const seed = await createSeedClient()
        await seed.$resetDatabase()
      `);

    expect(
      (await db.query(`SELECT * FROM ${adapter.escapeIdentifier("BABBA")}`))
        .length,
    ).toBe(0);
    expect(
      (await db.query(`SELECT * FROM ${adapter.escapeIdentifier("BABA")}`))
        .length,
    ).toBe(2);
  });
}
