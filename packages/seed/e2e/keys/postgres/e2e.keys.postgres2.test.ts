import { test as _test, type TestFunction, expect } from "vitest";
import { adapterEntries } from "#test/adapters.js";
import { setupProject } from "#test/setupProject.js";

for (const [dialect, adapter] of adapterEntries.filter(
  ([dialect, _]) => dialect === "postgres",
)) {
  const computeName = (name: string) => `e2e > keys > ${dialect} > ${name}`;
  const test = (name: string, fn: TestFunction) => {
    // eslint-disable-next-line vitest/expect-expect, vitest/valid-title
    _test.concurrent(computeName(name), fn);
  };

  test("with multi columns nullable with unique null not distinct and too many error", async () => {
    const schema = `
          CREATE TABLE "Match" (
            "teamId" integer,
            "gameId" integer,
            "score" integer NOT NULL,
            UNIQUE NULLS NOT DISTINCT ("teamId", "gameId")
          );
        `;

    await expect(() =>
      setupProject({
        adapter,
        databaseSchema: schema,
        seedScript: `
          import { createSeedClient } from '#snaplet/seed'
          import {copycat} from '@snaplet/copycat'

          const seed = await createSeedClient({ dryRun: false })
          // There is maximum 4 possible combinations of nulls not distinct this should fail
          await seed.matches((x) => x(5,
            () => ({
              teamId: ({seed}) => copycat.oneOf(seed, [null, 1]),
              gameId: ({seed}) => copycat.oneOf(seed, [null, 1]),
            })
          ))
        `,
      }),
    ).rejects.toThrow(
      `Unique constraint "Match_teamId_gameId_key" violated for model "matches" on fields (gameId,teamId)`,
    );
  });

  test("with on multi FK null made by nullable unique index and nulls not distinct", async () => {
    const schema = `
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
          -- Original Match table allowing nullable composite keys
          CREATE TABLE "Match" (
            "teamId" integer REFERENCES "Team"("id"),
            "gameId" integer REFERENCES "Game"("id"),
            "score" integer NOT NULL,
            UNIQUE NULLS NOT DISTINCT ("teamId", "gameId")
          );
        `;

    const { db } = await setupProject({
      adapter,
      databaseSchema: schema,
      seedScript: `
          import { createSeedClient } from '#snaplet/seed'
          const seed = await createSeedClient({ dryRun: false })
          await seed.teams((x) => x(1, {
            players: (x) => x(1)
          }));
          await seed.games((x) => x(1));
          // There is only 4 possible combinations of nulls not distinct
          await seed.matches((x) => x(4), { connect: true });
        `,
    });

    // Perform the queries and assertions
    const teams = await db.query<{ id: number }>('SELECT * FROM "Team"');
    expect(teams.length).toEqual(1);
    const players = await db.query<{
      id: number;
      name: string;
      teamId: number;
    }>('SELECT * FROM "Player"');
    expect(players.length).toEqual(1);
    const games = await db.query<{ id: number }>('SELECT * FROM "Game"');
    // Expected to have no games inserted; adjust based on seed logic
    expect(games.length).toEqual(1);
    const matches = await db.query<{
      gameId: null | number;
      score: number;
      teamId: null | number;
    }>('SELECT * FROM "Match" ORDER BY "score"');
    expect(matches.length).toEqual(4);

    // Assertions for IDs and matches according to your test setup
    const teamIDs = teams.map((team) => Number(team.id)).sort((a, b) => a - b);
    const playerIDs = players
      .map((player) => Number(player.id))
      .sort((a, b) => a - b);
    expect(teamIDs).toEqual([1]);
    expect(playerIDs).toEqual([1]);

    // Only in postgres dialect it's possible for a table to have no primary key or UNIQUE NON NULLABLE index
    // on sqlite we'll always fallback on the table rowid and be able to do the connection
    // Matches will have null values for teamId and gameId due to the fact there is not PK on this table to perform subsequent UPDATE
    expect(matches).toEqual(
      expect.arrayContaining([
        { teamId: null, gameId: null, score: expect.any(Number) },
        { teamId: null, gameId: 1, score: expect.any(Number) },
        { teamId: 1, gameId: 1, score: expect.any(Number) },
        { teamId: 1, gameId: null, score: expect.any(Number) },
      ]),
    );
  });

  test("should multi FK fail the constraint if we ask for too many rows with nulls not distinct", async () => {
    const schema = `
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
          -- Original Match table allowing nullable composite keys
          CREATE TABLE "Match" (
            "teamId" integer REFERENCES "Team"("id"),
            "gameId" integer REFERENCES "Game"("id"),
            "score" integer NOT NULL,
            UNIQUE NULLS NOT DISTINCT ("teamId", "gameId")
          );
        `;

    await expect(() =>
      setupProject({
        adapter,
        databaseSchema: schema,
        seedScript: `
        import { createSeedClient } from '#snaplet/seed'
        const seed = await createSeedClient({ dryRun: false })
        await seed.teams((x) => x(1, {
          players: (x) => x(1)
        }));
        await seed.games((x) => x(1));
        // There is only 4 possible combinations of nulls not distinct and we ask for 5, this should fail
        await seed.matches((x) => x(5), { connect: true });
      `,
      }),
    ).rejects.toThrow(
      `Unique constraint "Match_teamId_gameId_key" violated for model "matches" on fields (gameId,teamId)`,
    );
  });
}
