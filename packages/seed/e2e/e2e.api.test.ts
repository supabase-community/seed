import { test as _test, type TestFunction, expect } from "vitest";
import { type DialectId } from "#dialects/dialects.js";
import { adapterEntries } from "#test/adapters.js";
import { setupProject } from "#test/setupProject.js";

type DialectRecordWithDefault<T> = Partial<Record<DialectId, T>> &
  Record<"default", T>;
type SchemaRecord = DialectRecordWithDefault<string>;
type SeedScriptRecord = DialectRecordWithDefault<string>;
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
        import { createSeedClient } from '#seed'
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
    import { createSeedClient } from '#seed'
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
        import { createSeedClient } from '#seed'

        const seed = await createSeedClient()
        await seed.$resetDatabase()
      `);

    expect((await db.query('SELECT * FROM "BABBA"')).length).toBe(0);
    expect((await db.query('SELECT * FROM "BABA"')).length).toBe(2);
  });

  test("seed.$resetDatabase should not reset parameterized excluded table", async () => {
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

    const seedScript: SeedScriptRecord = {
      default: `
          import { createSeedClient } from '#seed'

          const seed = await createSeedClient()
          await seed.$resetDatabase(["!BABA"])
        `,
      postgres: `
          import { createSeedClient } from '#seed'

          const seed = await createSeedClient()
          await seed.$resetDatabase(["!public.BABA"])
        `,
    };

    const { db, runSeedScript } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
    });

    await db.execute(`INSERT INTO "BABBA" DEFAULT VALUES`);
    await db.execute(`INSERT INTO "BABBA" DEFAULT VALUES`);

    await db.execute(`INSERT INTO "BABA" DEFAULT VALUES`);
    await db.execute(`INSERT INTO "BABA" DEFAULT VALUES`);

    await runSeedScript(seedScript[dialect] ?? seedScript.default);

    expect((await db.query('SELECT * FROM "BABBA"')).length).toBe(0);
    expect((await db.query('SELECT * FROM "BABA"')).length).toBe(2);
  });

  test("seed.$resetDatabase should not reset parameterized excluded table with star syntax", async () => {
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

    const seedScript: SeedScriptRecord = {
      default: `
          import { createSeedClient } from '#seed'

          const seed = await createSeedClient()
          await seed.$resetDatabase(["!BA*"])
        `,
      postgres: `
          import { createSeedClient } from '#seed'

          const seed = await createSeedClient()
          await seed.$resetDatabase(["!public.BA*"])
        `,
    };

    const { db, runSeedScript } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
    });

    await db.execute(`INSERT INTO "BABBA" DEFAULT VALUES`);
    await db.execute(`INSERT INTO "BABBA" DEFAULT VALUES`);

    await db.execute(`INSERT INTO "BABA" DEFAULT VALUES`);
    await db.execute(`INSERT INTO "BABA" DEFAULT VALUES`);

    await runSeedScript(seedScript[dialect] ?? seedScript.default);

    expect((await db.query('SELECT * FROM "BABBA"')).length).toBe(2);
    expect((await db.query('SELECT * FROM "BABA"')).length).toBe(2);
  });

  test("seed.$resetDatabase reset tables even if there is data with foreign keys in it", async () => {
    const schema: SchemaRecord = {
      default: `
          -- CreateTable
          CREATE TABLE "Account" (
              "id" TEXT NOT NULL,
              "email" TEXT NOT NULL,
              CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
          );

          -- CreateTable
          CREATE TABLE "Password" (
              "id" TEXT NOT NULL,
              "salt" TEXT NOT NULL,
              "hash" TEXT NOT NULL,
              "accountId" TEXT NOT NULL,
              CONSTRAINT "Password_pkey" PRIMARY KEY ("id"),
              CONSTRAINT "Password_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE
          );

          -- CreateIndex
          CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email");

          -- CreateIndex
          CREATE UNIQUE INDEX "Password_accountId_key" ON "Password"("accountId");
        `,
      sqlite: `
          -- CreateTable
          CREATE TABLE "Account" (
              "id" TEXT NOT NULL PRIMARY KEY,
              "email" TEXT NOT NULL
          );

          -- CreateTable
          CREATE TABLE "Password" (
              "id" TEXT NOT NULL PRIMARY KEY,
              "salt" TEXT NOT NULL,
              "hash" TEXT NOT NULL,
              "accountId" TEXT NOT NULL,
              CONSTRAINT "Password_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
          );

          -- CreateIndex
          CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email");

          -- CreateIndex
          CREATE UNIQUE INDEX "Password_accountId_key" ON "Password"("accountId");
        `,
    };

    const seedScript: SeedScriptRecord = {
      default: `
          import { createSeedClient } from '#seed'

          const seed = await createSeedClient()
          await seed.$resetDatabase()
        `,
    };

    const { db, runSeedScript } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
    });

    // We insert some data in our database
    await db.execute(
      `INSERT INTO "Account" (id,email) VALUES ('cc7ebf70-44ca-5e4a-a8f3-37def829095a', 'Donny.Keeling37878@likely-umbrella.net');`,
    );
    await db.execute(
      `INSERT INTO "Password" (id,salt,hash,"accountId") VALUES ('4a96e682-0766-5a91-8e43-faea1fb340a1', '1234567', '123456', 'cc7ebf70-44ca-5e4a-a8f3-37def829095a');`,
    );

    await runSeedScript(seedScript[dialect] ?? seedScript.default);

    expect((await db.query('SELECT * FROM "Account"')).length).toBe(0);
    expect((await db.query('SELECT * FROM "Password"')).length).toBe(0);
  });

  if (dialect === "postgres") {
    test("seed.$resetDatabase should reset all schemas and tables per default", async () => {
      const seedScript = `
      import { createSeedClient } from '#seed'
      const seed = await createSeedClient()
      await seed.$resetDatabase()
      await seed.teams((x) => x(2, {
        players: (x) => x(3)
      }));
      await seed.games((x) => x(3));
    `;
      const { db, runSeedScript } = await setupProject({
        adapter,
        databaseSchema: `
          CREATE SCHEMA IF NOT EXISTS hdb_catalog;
          CREATE TABLE hdb_catalog."SystemSettings" (
            "settingKey" VARCHAR(255) PRIMARY KEY,
            "settingValue" TEXT NOT NULL
          );

          CREATE TABLE hdb_catalog."AuditLog" (
            "logId" SERIAL PRIMARY KEY,
            "action" TEXT NOT NULL,
            "timestamp" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "userId" INTEGER
          );

          INSERT INTO hdb_catalog."SystemSettings" ("settingKey", "settingValue") VALUES
          ('theme', 'dark'),
          ('retryInterval', '30');

          INSERT INTO hdb_catalog."AuditLog" ("action", "userId") VALUES
          ('System Start', NULL),
          ('Initial Configuration', NULL);

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
        seedScript,
      });
      expect((await db.query('SELECT * FROM "Player"')).length).toEqual(6);
      expect(
        (await db.query('SELECT * FROM hdb_catalog."AuditLog"')).length,
      ).toEqual(0);
      expect(
        (await db.query('SELECT * FROM hdb_catalog."SystemSettings"')).length,
      ).toEqual(0);
      // Should be able to re-run the seed script again thanks to the $resetDatabase
      await runSeedScript(seedScript);
      expect((await db.query('SELECT * FROM "Player"')).length).toEqual(6);
    });

    test("seed.$resetDatabase should not reset config excluded schema", async () => {
      const seedConfig = (connectionString: string) =>
        adapter.generateSeedConfig(connectionString, {
          select: `["!hdb_catalog.*"]`,
        });

      const seedScript = `
      import { createSeedClient } from "#seed"
      const seed = await createSeedClient()
      await seed.$resetDatabase()
      await seed.teams((x) => x(2, {
        players: (x) => x(3)
      }));
      await seed.games((x) => x(3));
    `;
      const { db, runSeedScript } = await setupProject({
        adapter,
        databaseSchema: `
          CREATE SCHEMA IF NOT EXISTS hdb_catalog;
          CREATE TABLE hdb_catalog."SystemSettings" (
            "settingKey" VARCHAR(255) PRIMARY KEY,
            "settingValue" TEXT NOT NULL
          );

          CREATE TABLE hdb_catalog."AuditLog" (
            "logId" SERIAL PRIMARY KEY,
            "action" TEXT NOT NULL,
            "timestamp" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "userId" INTEGER
          );

          INSERT INTO hdb_catalog."SystemSettings" ("settingKey", "settingValue") VALUES
          ('theme', 'dark'),
          ('retryInterval', '30');

          INSERT INTO hdb_catalog."AuditLog" ("action", "userId") VALUES
          ('System Start', NULL),
          ('Initial Configuration', NULL);

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
        seedConfig,
        seedScript,
      });
      expect((await db.query('SELECT * FROM "Player"')).length).toEqual(6);
      expect(
        (await db.query('SELECT * FROM hdb_catalog."AuditLog"')).length,
      ).toEqual(2);
      expect(
        (await db.query('SELECT * FROM hdb_catalog."SystemSettings"')).length,
      ).toEqual(2);
      // Should be able to re-run the seed script again thanks to the $resetDatabase
      await runSeedScript(seedScript);
      expect((await db.query('SELECT * FROM "Player"')).length).toEqual(6);
    });

    test("seed.$resetDatabase should not reset config excluded table", async () => {
      const seedConfig = (connectionString: string) =>
        adapter.generateSeedConfig(connectionString, {
          select: `["!hdb_catalog.SystemSettings"]`,
        });
      const seedScript = `
      import { createSeedClient } from "#seed"
      const seed = await createSeedClient()
      await seed.$resetDatabase()
      await seed.teams((x) => x(2, {
        players: (x) => x(3)
      }));
      await seed.games((x) => x(3));
    `;
      const { db, runSeedScript } = await setupProject({
        adapter,
        databaseSchema: `
          CREATE SCHEMA IF NOT EXISTS hdb_catalog;
          CREATE TABLE hdb_catalog."SystemSettings" (
            "settingKey" VARCHAR(255) PRIMARY KEY,
            "settingValue" TEXT NOT NULL
          );

          CREATE TABLE hdb_catalog."AuditLog" (
            "logId" SERIAL PRIMARY KEY,
            "action" TEXT NOT NULL,
            "timestamp" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            "userId" INTEGER
          );

          INSERT INTO hdb_catalog."SystemSettings" ("settingKey", "settingValue") VALUES
          ('theme', 'dark'),
          ('retryInterval', '30');

          INSERT INTO hdb_catalog."AuditLog" ("action", "userId") VALUES
          ('System Start', NULL),
          ('Initial Configuration', NULL);

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
        seedConfig,
        seedScript,
      });
      expect((await db.query('SELECT * FROM "Player"')).length).toEqual(6);
      expect(
        (await db.query('SELECT * FROM hdb_catalog."AuditLog"')).length,
      ).toEqual(0);
      expect(
        (await db.query('SELECT * FROM hdb_catalog."SystemSettings"')).length,
      ).toEqual(2);
      // Should be able to re-run the seed script again thanks to the $resetDatabase
      await runSeedScript(seedScript);
      expect((await db.query('SELECT * FROM "Player"')).length).toEqual(6);
    });
  }
}
