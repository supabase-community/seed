import { test as _test, type TestFunction, expect } from "vitest";
import { adapterEntries } from "#test/adapters.js";
import { setupProject } from "#test/setupProject.js";

for (const [dialect, adapter] of adapterEntries.filter(
  ([dialect]) => dialect === "postgres",
)) {
  const computeName = (name: string) => `e2e > api > ${dialect} > ${name}`;
  const test = (name: string, fn: TestFunction) => {
    // eslint-disable-next-line vitest/expect-expect, vitest/valid-title
    _test.concurrent(computeName(name), fn);
  };

  test("seed.$resetDatabase should reset all schemas and tables per default", async () => {
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
      import { createSeedClient } from "#snaplet/seed"
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
      import { createSeedClient } from "#snaplet/seed"
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
