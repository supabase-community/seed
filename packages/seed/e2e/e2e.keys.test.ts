import { describe, expect, test } from "vitest";
import { type Dialect, adapters } from "#test/adapters.js";
import { setupProject } from "#test/setupProject.js";

for (const dialect of Object.keys(adapters) as Array<Dialect>) {
  const adapter = await adapters[dialect]();

  if (adapter.skipReason) {
    describe.skip(`e2e: ${dialect} (${adapter.skipReason})`, () => {
      null;
    });

    continue;
  }

  describe.concurrent(
    `e2e keys: ${dialect}`,
    () => {
      test("work as expected with composites primary keys", async () => {
        const schema: Partial<Record<"default" | Dialect, string>> = {
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
            -- Create a Match table with a composite primary key based on two foreign keys
            CREATE TABLE "Match" (
              "teamId" integer REFERENCES "Team"("id"),
              "gameId" integer REFERENCES "Game"("id"),
              "score" integer NOT NULL,
              PRIMARY KEY ("teamId", "gameId")
            );
          `,
          sqlite: `
          CREATE TABLE "Team" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT
          );
          CREATE TABLE "Player" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "teamId" INTEGER NOT NULL,
            "name" TEXT NOT NULL,
            FOREIGN KEY ("teamId") REFERENCES "Team"("id")
          );
          CREATE TABLE "Game" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT
          );
          -- Composite primary key in SQLite
          CREATE TABLE "Match" (
            "teamId" INTEGER NOT NULL,
            "gameId" INTEGER NOT NULL,
            "score" INTEGER NOT NULL,
            PRIMARY KEY ("teamId", "gameId"),
            FOREIGN KEY ("teamId") REFERENCES "Team"("id"),
            FOREIGN KEY ("gameId") REFERENCES "Game"("id")
          );`,
        };
        const { db } = await setupProject({
          adapter,
          databaseSchema: schema[dialect] ?? schema.default,
          seedScript: `
          import { createSeedClient } from '#seed'
            const seed = await createSeedClient({ dryRun: false })
            await seed.teams((x) => x(2, {
              players: (x) => x(3)
            }));
            // Assuming seed.matches connects matches to existing teams and games
            await seed.matches((x) => x(3), { connect: true });
          `,
        });

        const teams = await db.query<{ id: number }>('SELECT * FROM "Team"');
        expect(teams.length).toEqual(2);
        const players = await db.query<{
          id: number;
          name: string;
          teamId: number;
        }>('SELECT * FROM "Player"');
        expect(players.length).toEqual(6);
        const games = await db.query<{ id: number }>('SELECT * FROM "Game"');
        expect(games.length).toEqual(3);
        const matches = await db.query<{
          gameId: number;
          score: number;
          teamId: number;
        }>('SELECT * FROM "Match"');
        expect(matches.length).toEqual(3);

        // Assuming db.query returns an array of objects with column names as keys
        const teamIDs = teams
          .map((row) => Number(row.id))
          .sort((a, b) => a - b);
        const playerIDs = players
          .map((row) => Number(row.id))
          .sort((a, b) => a - b);
        const gameIDs = games
          .map((row) => Number(row.id))
          .sort((a, b) => a - b);

        expect(teamIDs).toEqual([1, 2]);
        expect(playerIDs).toEqual([1, 2, 3, 4, 5, 6]);
        expect(gameIDs).toEqual([1, 2, 3]);
        // Adapt your expectation for matches to the actual data and structure you expect
        expect(matches).toEqual([
          { gameId: 1, score: expect.any(Number), teamId: 1 },
          { gameId: 2, score: expect.any(Number), teamId: 1 },
          { gameId: 3, score: expect.any(Number), teamId: 2 },
        ]);
      });
      test("work as expected with composite primary keys made by non nullable unique index", async () => {
        const schema: Partial<Record<"default" | Dialect, string>> = {
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
            -- Original Match table with a composite key made unique
            CREATE TABLE "Match" (
              "teamId" integer NOT NULL REFERENCES "Team"("id"),
              "gameId" integer NOT NULL REFERENCES "Game"("id"),
              "score" integer NOT NULL,
              UNIQUE ("teamId", "gameId")
            );
          `,
          sqlite: `
            CREATE TABLE "Team" (
              "id" INTEGER PRIMARY KEY AUTOINCREMENT
            );
            CREATE TABLE "Player" (
              "id" INTEGER PRIMARY KEY AUTOINCREMENT,
              "teamId" INTEGER NOT NULL,
              "name" TEXT NOT NULL,
              FOREIGN KEY ("teamId") REFERENCES "Team"("id")
            );
            CREATE TABLE "Game" (
              "id" INTEGER PRIMARY KEY AUTOINCREMENT
            );
            -- Adjusted Match table for SQLite
            CREATE TABLE "Match" (
              "teamId" INTEGER NOT NULL,
              "gameId" INTEGER NOT NULL,
              "score" INTEGER NOT NULL,
              FOREIGN KEY ("teamId") REFERENCES "Team"("id"),
              FOREIGN KEY ("gameId") REFERENCES "Game"("id"),
              UNIQUE ("teamId", "gameId")
            );
          `,
        };
        const { db } = await setupProject({
          adapter,
          databaseSchema: schema[dialect] ?? schema.default,
          seedScript: `
            import { createSeedClient } from '#seed'
            const seed = await createSeedClient({ dryRun: false })
            await seed.teams((x) => x(2, {
              players: (x) => x(3)
            }));
            // Assuming seed.matches attempts to connect matches to existing teams and games
            await seed.matches((x) => x(3), { connect: true });
          `,
        });

        // Perform the queries and assertions similar to the previous tests

        const teams = await db.query<{ id: number }>('SELECT * FROM "Team"');
        expect(teams.length).toEqual(2);
        const players = await db.query<{
          id: number;
          name: string;
          teamId: number;
        }>('SELECT * FROM "Player"');
        expect(players.length).toEqual(6);
        const games = await db.query<{ id: number }>('SELECT * FROM "Game"');
        expect(games.length).toEqual(3);
        const matches = await db.query<{
          gameId: number;
          score: number;
          teamId: number;
        }>('SELECT * FROM "Match"');
        expect(matches.length).toEqual(3);

        const teamIDs = teams
          .map((row) => Number(row.id))
          .sort((a, b) => a - b);
        const playerIDs = players
          .map((row) => Number(row.id))
          .sort((a, b) => a - b);
        expect(teamIDs).toEqual([1, 2]);
        expect(playerIDs).toEqual([1, 2, 3, 4, 5, 6]);
        expect(matches).toEqual([
          { gameId: 1, score: expect.any(Number), teamId: 1 },
          { gameId: 2, score: expect.any(Number), teamId: 1 },
          { gameId: 3, score: expect.any(Number), teamId: 2 },
        ]);
      });
      test("work as expected with composite primary keys made by nullable unique index", async () => {
        const schema: Partial<Record<"default" | Dialect, string>> = {
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
            -- Original Match table allowing nullable composite keys
            CREATE TABLE "Match" (
              "teamId" integer REFERENCES "Team"("id"),
              "gameId" integer REFERENCES "Game"("id"),
              "score" integer NOT NULL,
              UNIQUE ("teamId", "gameId")
            );
          `,
          sqlite: `
            CREATE TABLE "Team" (
              "id" INTEGER PRIMARY KEY AUTOINCREMENT
            );
            CREATE TABLE "Player" (
              "id" INTEGER PRIMARY KEY AUTOINCREMENT,
              "teamId" INTEGER NOT NULL,
              "name" TEXT NOT NULL,
              FOREIGN KEY ("teamId") REFERENCES "Team"("id")
            );
            CREATE TABLE "Game" (
              "id" INTEGER PRIMARY KEY AUTOINCREMENT
            );
            -- Adjusted Match table for SQLite, explicitly allowing NULLs in composite unique keys
            CREATE TABLE "Match" (
              "teamId" INTEGER,
              "gameId" INTEGER,
              "score" INTEGER NOT NULL,
              FOREIGN KEY ("teamId") REFERENCES "Team"("id"),
              FOREIGN KEY ("gameId") REFERENCES "Game"("id"),
              UNIQUE ("teamId", "gameId")
            );
          `,
        };
        const { db } = await setupProject({
          adapter,
          databaseSchema: schema[dialect] ?? schema.default,
          seedScript: `
            import { createSeedClient } from '#seed'
            const seed = await createSeedClient({ dryRun: false })
            await seed.teams((x) => x(2, {
              players: (x) => x(3)
            }));
            await seed.matches((x) => x(3), { connect: true });
          `,
        });

        // Perform the queries and assertions
        const teams = await db.query<{ id: number }>('SELECT * FROM "Team"');
        expect(teams.length).toEqual(2);
        const players = await db.query<{
          id: number;
          name: string;
          teamId: number;
        }>('SELECT * FROM "Player"');
        expect(players.length).toEqual(6);
        const games = await db.query<{ id: number }>('SELECT * FROM "Game"');
        // Expected to have no games inserted; adjust based on seed logic
        expect(games.length).toEqual(0);
        const matches = await db.query<{
          gameId: null | number;
          score: number;
          teamId: null | number;
        }>('SELECT * FROM "Match" ORDER BY "score"');
        expect(matches.length).toEqual(3);

        // Assertions for IDs and matches according to your test setup
        const teamIDs = teams
          .map((team) => Number(team.id))
          .sort((a, b) => a - b);
        const playerIDs = players
          .map((player) => Number(player.id))
          .sort((a, b) => a - b);
        expect(teamIDs).toEqual([1, 2]);
        expect(playerIDs).toEqual([1, 2, 3, 4, 5, 6]);

        // Only in postgres dialect it's possible for a table to have no primary key or UNIQUE NON NULLABLE index
        // on sqlite we'll always fallback on the table rowid and be able to do the connection
        if (dialect === "postgres") {
          // Matches will have null values for teamId and gameId due to the fact there is not PK on this table to perform subsequent UPDATE
          expect(matches).toEqual([
            { teamId: null, gameId: null, score: expect.any(Number) },
            { teamId: null, gameId: null, score: expect.any(Number) },
            { teamId: null, gameId: null, score: expect.any(Number) },
          ]);
        } else {
          expect(matches).toEqual([
            {
              teamId: expect.any(Number),
              gameId: null,
              score: expect.any(Number),
            },
            {
              teamId: expect.any(Number),
              gameId: null,
              score: expect.any(Number),
            },
            {
              teamId: expect.any(Number),
              gameId: null,
              score: expect.any(Number),
            },
          ]);
        }
      });
      test("work as expected and UPDATE children with PRIMARY KEY field", async () => {
        const schema: Partial<Record<"default" | Dialect, string>> = {
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
            -- Composite primary key on "gameId" for "Match" table
            CREATE TABLE "Match" (
              "teamId" integer REFERENCES "Team"("id"),
              "gameId" integer NOT NULL REFERENCES "Game"("id"),
              "score" integer NOT NULL,
              PRIMARY KEY ("gameId")
            );
          `,
          sqlite: `
            CREATE TABLE "Team" (
              "id" INTEGER PRIMARY KEY AUTOINCREMENT
            );
            CREATE TABLE "Player" (
              "id" INTEGER PRIMARY KEY AUTOINCREMENT,
              "teamId" INTEGER NOT NULL,
              "name" TEXT NOT NULL,
              FOREIGN KEY ("teamId") REFERENCES "Team"("id")
            );
            CREATE TABLE "Game" (
              "id" INTEGER PRIMARY KEY AUTOINCREMENT
            );
            -- Adjusted "Match" table for SQLite with "gameId" as PRIMARY KEY
            CREATE TABLE "Match" (
              "teamId" INTEGER,
              "gameId" INTEGER NOT NULL,
              "score" INTEGER NOT NULL,
              PRIMARY KEY ("gameId"),
              FOREIGN KEY ("teamId") REFERENCES "Team"("id"),
              FOREIGN KEY ("gameId") REFERENCES "Game"("id")
            );
          `,
        };
        const { db } = await setupProject({
          adapter,
          databaseSchema: schema[dialect] ?? schema.default,
          seedScript: `
            import { createSeedClient } from '#seed'
            const seed = await createSeedClient({ dryRun: false })
            await seed.teams((x) => x(2, {
              players: (x) => x(3)
            }))
            await seed.matches((x) => x(3), { connect: true })
          `,
        });

        // Your query and assertion logic
        const teams = await db.query<{ id: number }>('SELECT * FROM "Team"');
        expect(teams.length).toEqual(2);
        const players = await db.query<{
          id: number;
          name: string;
          teamId: number;
        }>('SELECT * FROM "Player"');
        expect(players.length).toEqual(6);
        const games = await db.query<{ id: number }>('SELECT * FROM "Game"');
        expect(games.length).toEqual(3);
        const matches = await db.query<{
          gameId: number;
          score: number;
          teamId: null | number;
        }>('SELECT * FROM "Match"');
        expect(matches.length).toEqual(3);

        // Additional assertions as needed, similar to previous structure
        const teamIDs = teams.map((team) => team.id).sort((a, b) => a - b);
        const playerIDs = players
          .map((player) => Number(player.id))
          .sort((a, b) => a - b);
        // Adapt for your db query response format
        expect(teamIDs).toEqual([1, 2]);
        expect(playerIDs).toEqual([1, 2, 3, 4, 5, 6]);
        // Verify match records as per your requirements
        expect(matches).toEqual([
          { gameId: 1, score: expect.any(Number), teamId: 1 },
          { gameId: 2, score: expect.any(Number), teamId: 1 },
          { gameId: 3, score: expect.any(Number), teamId: 2 },
        ]);
      });
      test("work as expected and UPDATE children with UNIQUE NON NULLABLE field", async () => {
        const schema: Partial<Record<"default" | Dialect, string>> = {
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
            -- Match table with "gameId" as a UNIQUE NON NULLABLE field
            CREATE TABLE "Match" (
              "teamId" integer REFERENCES "Team"("id"),
              "gameId" integer NOT NULL REFERENCES "Game"("id"),
              "score" integer NOT NULL,
              UNIQUE ("gameId")
            );
          `,
          sqlite: `
            CREATE TABLE "Team" (
              "id" INTEGER PRIMARY KEY AUTOINCREMENT
            );
            CREATE TABLE "Player" (
              "id" INTEGER PRIMARY KEY AUTOINCREMENT,
              "teamId" INTEGER NOT NULL,
              "name" TEXT NOT NULL,
              FOREIGN KEY ("teamId") REFERENCES "Team"("id")
            );
            CREATE TABLE "Game" (
              "id" INTEGER PRIMARY KEY AUTOINCREMENT
            );
            -- Adjusted Match table for SQLite with UNIQUE constraint on "gameId"
            CREATE TABLE "Match" (
              "teamId" INTEGER,
              "gameId" INTEGER NOT NULL UNIQUE,
              "score" INTEGER NOT NULL,
              FOREIGN KEY ("teamId") REFERENCES "Team"("id"),
              FOREIGN KEY ("gameId") REFERENCES "Game"("id")
            );
          `,
        };
        const { db } = await setupProject({
          adapter,
          databaseSchema: schema[dialect] ?? schema.default,
          seedScript: `
            import { createSeedClient } from "#seed"
            const seed = await createSeedClient()
            await seed.teams((x) => x(2, {
              players: (x) => x(3)
            }))
            await seed.matches((x) => x(3), { connect: true })
          `,
        });

        // Your query and assertion logic
        const teams = await db.query<{ id: number }>('SELECT * FROM "Team"');
        expect(teams.length).toEqual(2);
        const players = await db.query<{
          id: number;
          name: string;
          teamId: number;
        }>('SELECT * FROM "Player"');
        expect(players.length).toEqual(6);
        const games = await db.query<{ id: number }>('SELECT * FROM "Game"');
        expect(games.length).toEqual(3);
        const matches = await db.query<{
          gameId: number;
          score: number;
          teamId: null | number; // Reflecting possible nullable foreign key
        }>('SELECT * FROM "Match"');
        expect(matches.length).toEqual(3);

        // Additional assertions for ID sequences and match specifics
        const teamIDs = teams.map((team) => team.id).sort((a, b) => a - b);
        const playerIDs = players
          .map((player) => Number(player.id))
          .sort((a, b) => a - b);
        // Ensuring the "gameId" uniqueness is maintained
        expect(teamIDs).toEqual([1, 2]);
        expect(playerIDs).toEqual([1, 2, 3, 4, 5, 6]);
        expect(matches).toEqual([
          { gameId: 1, score: expect.any(Number), teamId: 1 },
          { gameId: 2, score: expect.any(Number), teamId: 1 },
          { gameId: 3, score: expect.any(Number), teamId: 2 },
        ]);
      });
    },
    {
      timeout: 45000,
    },
  );
}
