import { describe, expect, test } from "vitest";
import { adapters } from "#test/adapters.js";
import { setupProject } from "#test/setupProject.js";

const adapter = await adapters.postgres();

describe.concurrent(
  `e2e: postgres-specific`,
  () => {
    test("works with multiple schemas", async () => {
      const { db } = await setupProject({
        adapter,
        databaseSchema: `
          CREATE SCHEMA "other";
          CREATE TABLE "public"."User" (
            "id" uuid not null primary key
          );
          CREATE TABLE "other"."Post" (
            "id" uuid not null primary key
          );
        `,
        seedScript: `
          import { createSeedClient } from '#seed'

          const seed = await createSeedClient()

          await seed.users((x) => x(2))
          await seed.posts((x) => x(2))
        `,
      });

      expect((await db.query('select * from "User"')).length).toEqual(2);

      expect((await db.query('select * from "other"."Post"')).length).toEqual(
        2,
      );
    });

    test("work with citext pg type", async () => {
      const { db } = await setupProject({
        adapter,
        databaseSchema: `
          CREATE EXTENSION citext;
          CREATE TABLE "user" (
            "id" SERIAL PRIMARY KEY,
            "email" citext NOT NULL
          );
        `,
        seedScript: `
          import { createSeedClient } from "#seed"
          const seed = await createSeedClient()
          await seed.users((x) => x(2))
        `,
      });

      // Check if the tables have been populated with the correct number of entries
      expect((await db.query('SELECT * FROM "user"')).length).toEqual(2);
    });

    describe("$resetDatabase", () => {
      test("should reset all schemas and tables per default", async () => {
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

      test("should not reset config excluded schema", async () => {
        const seedConfig = `
        import { defineConfig } from "@snaplet/seed/config";

        export default defineConfig({
          select: {
            'hdb_catalog.*': false,
          },
        })
  `;
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
          seedConfig: seedConfig,
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

      test("should not reset config excluded table", async () => {
        const seedConfig = `
        import { defineConfig } from "@snaplet/seed/config";

        export default defineConfig({
          select: {
            "hdb_catalog.SystemSettings": false,
          },
        })
  `;
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
          seedConfig: seedConfig,
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
    });
  },
  {
    timeout: 45000,
  },
);
