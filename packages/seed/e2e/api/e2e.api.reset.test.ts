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
    const { db } = await setupProject({
      adapter,
      databaseSchema: `
        CREATE TABLE "User" (
          "id" uuid not null,
          "fullName" text not null
        );
      `,
      seedScript: `
        import { createSeedClient } from '#snaplet/seed'
        const seed = await createSeedClient()
        await seed.users([{
          fullName: () => Promise.resolve('Foo Bar')
        }])
      `,
    });

    const [{ fullName }] = await db.query<{ fullName: string }>(
      'select * from "User"',
    );

    expect(fullName).toEqual("Foo Bar");
  });

  test("seed.$resetDatabase should reset all tables per default", async () => {
    const schema: SchemaRecord = {
      default: `
          CREATE TABLE "Team" (
            "id" SERIAL PRIMARY KEY
          );
          CREATE TABLE "Player" (
            "id" BIGSERIAL PRIMARY KEY,
            "teamId" integer NOT NULL REFERENCES "Team"("id"),
            "name" text NOT NULL
          );
          CREATE TABLE "Game" (
            "id" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY
          );
        `,
      sqlite: `
          CREATE TABLE "Team" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT
          );
          CREATE TABLE "Player" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "teamId" integer NOT NULL REFERENCES "Team"("id"),
            "name" text NOT NULL
          );
          CREATE TABLE "Game" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT
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
    expect((await db.query('SELECT * FROM "Player"')).length).toEqual(6);
    expect((await db.query('SELECT * FROM "Team"')).length).toEqual(2);
    expect((await db.query('SELECT * FROM "Game"')).length).toEqual(3);
    // Should be able to re-run the seed script again thanks to the $resetDatabase
    await runSeedScript(seedScript);
    expect((await db.query('SELECT * FROM "Player"')).length).toEqual(6);
    expect((await db.query('SELECT * FROM "Team"')).length).toEqual(2);
    expect((await db.query('SELECT * FROM "Game"')).length).toEqual(3);
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
    };

    const { db, runSeedScript } = await setupProject({
      adapter,
      seedConfig: seedConfig[dialect] ?? seedConfig.default,
      databaseSchema: schema[dialect] ?? schema.default,
    });

    await db.execute(`INSERT INTO "BABBA" DEFAULT VALUES`);
    await db.execute(`INSERT INTO "BABBA" DEFAULT VALUES`);

    await db.execute(`INSERT INTO "BABA" DEFAULT VALUES`);
    await db.execute(`INSERT INTO "BABA" DEFAULT VALUES`);

    await runSeedScript(`
        import { createSeedClient } from '#snaplet/seed'

        const seed = await createSeedClient()
        await seed.$resetDatabase()
      `);

    expect((await db.query('SELECT * FROM "BABBA"')).length).toBe(0);
    expect((await db.query('SELECT * FROM "BABA"')).length).toBe(2);
  });
}
