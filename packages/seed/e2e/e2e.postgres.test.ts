import { test as _test, type TestFunction, expect } from "vitest";
import { adapters } from "#test/adapters.js";
import { setupProject } from "#test/setupProject.js";

const adapter = adapters.postgres;

const computeName = (name: string) => `e2e > api > postgres > ${name}`;
const test = (name: string, fn: TestFunction) => {
  // eslint-disable-next-line vitest/expect-expect, vitest/valid-title
  _test.concurrent(computeName(name), fn);
};

test("generates valid sequences for tables with ids as sequences or identity", async () => {
  const { db } = await setupProject({
    adapter,
    databaseSchema: `
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
    seedScript: `
        import { createSeedClient } from '#seed'
          const seed = await createSeedClient({ dryRun: false })
          await seed.teams((x) => x(2, {
            players: (x) => x(3)
          }));
          await seed.games((x) => x(3));
        `,
  });

  const teams = await db.query<{ id: number }>('SELECT * FROM "Team"');
  const players = await db.query<{
    id: number;
    name: string;
    teamId: number;
  }>('SELECT * FROM "Player"');
  const games = await db.query<{ id: number }>('SELECT * FROM "Game"');
  expect(teams.length).toEqual(2); // Expected number of teams
  expect(players.length).toEqual(6); // Expected number of players
  expect(games.length).toEqual(3); // Expected number of games
  const teamIDs = teams.map((row) => Number(row.id)).sort((a, b) => a - b);
  const playerIDs = players.map((row) => Number(row.id)).sort((a, b) => a - b);
  const gameIDs = games.map((row) => Number(row.id)).sort((a, b) => a - b);

  expect(teamIDs).toEqual([1, 2]);
  expect(playerIDs).toEqual([1, 2, 3, 4, 5, 6]);
  expect(gameIDs).toEqual([1, 2, 3]);
});

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
        import { createSeedClient } from "#seed"
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
        import { createSeedClient } from "#seed"
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
