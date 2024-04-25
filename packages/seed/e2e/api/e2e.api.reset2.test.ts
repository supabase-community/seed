import { test as _test, type TestFunction, expect } from "vitest";
import { type DialectId } from "#dialects/dialects.js";
import { adapterEntries } from "#test/adapters.js";
import { setupProject } from "#test/setupProject.js";

type DialectRecordWithDefault<T> = Partial<Record<DialectId, T>> &
  Record<"default", T>;
type SchemaRecord = DialectRecordWithDefault<string>;
type SeedScriptRecord = DialectRecordWithDefault<string>;

for (const [dialect, adapter] of adapterEntries) {
  const computeName = (name: string) => `e2e > api > ${dialect} > ${name}`;
  const test = (name: string, fn: TestFunction) => {
    // eslint-disable-next-line vitest/expect-expect, vitest/valid-title
    _test.concurrent(computeName(name), fn);
  };

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
          import { createSeedClient } from '#snaplet/seed'

          const seed = await createSeedClient()
          await seed.$resetDatabase(["!BABA"])
        `,
      postgres: `
          import { createSeedClient } from '#snaplet/seed'

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
          import { createSeedClient } from '#snaplet/seed'

          const seed = await createSeedClient()
          await seed.$resetDatabase(["!BA*"])
        `,
      postgres: `
          import { createSeedClient } from '#snaplet/seed'

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
          import { createSeedClient } from '#snaplet/seed'

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
}
