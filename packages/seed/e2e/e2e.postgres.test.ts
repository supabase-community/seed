import { test as _test, type TestFunction, expect } from "vitest";
import { adapters } from "#test/adapters.js";
import { setupProject } from "#test/setupProject.js";

const adapter = adapters.postgres;

const computeName = (name: string) => `e2e > api > postgres > ${name}`;
const test = (name: string, fn: TestFunction) => {
  // eslint-disable-next-line vitest/expect-expect, vitest/valid-title
  _test.concurrent(computeName(name), fn);
};

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
        import { createSeedClient } from '#snaplet/seed'

        const seed = await createSeedClient()

        await seed.users((x) => x(2))
        await seed.posts((x) => x(2))
      `,
  });

  expect((await db.query('select * from "User"')).length).toEqual(2);

  expect((await db.query('select * from "other"."Post"')).length).toEqual(2);
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
        import { createSeedClient } from "#snaplet/seed"
        const seed = await createSeedClient()
        await seed.users((x) => x(2))
      `,
  });

  // Check if the tables have been populated with the correct number of entries
  expect((await db.query('SELECT * FROM "user"')).length).toEqual(2);
});

test("inflection with singular vs plural", async () => {
  const { db } = await setupProject({
    adapter,
    databaseSchema: `
        CREATE TABLE public."user" (
          "user_id" SERIAL PRIMARY KEY,
          "foo" INTEGER NOT NULL
        );
        CREATE SCHEMA "auth";
        CREATE TABLE auth."users" (
          "user_id" SERIAL PRIMARY KEY,
          "bar" INTEGER NOT NULL
        );
      `,
    seedScript: `
        import { createSeedClient } from "#snaplet/seed"
        const seed = await createSeedClient()
        await seed.publicUsers(x => x(2))
        await seed.authUsers(x => x(2))
      `,
  });

  expect((await db.query('select * from public."user"')).length).toBe(2);
  expect((await db.query('select * from auth."users"')).length).toBe(2);
});

test("`generate` shows error message for unsolvable model name conflicts", async () => {
  await expect(
    setupProject({
      adapter,
      databaseSchema: `
    CREATE TABLE public."user" (
      "user_id" SERIAL PRIMARY KEY
    );

    CREATE TABLE public."users" (
      "user_id" SERIAL PRIMARY KEY
    );
  `,
    }),
  ).rejects.toThrow(/\* Alias "users" maps to: public\.user, public\.users/);
});
