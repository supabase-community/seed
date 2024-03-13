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
        snapletConfig: null,
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
  },
  {
    timeout: 45000,
  },
);
