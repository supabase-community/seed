import { describe, expect, test } from "vitest";
import { adapters } from "#test/adapters.js";
import { setupProject } from "#test/setupProject.js";

const adapter = await adapters.postgres();

describe.concurrent(
  `e2e: postgres-specific`,
  () => {
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
      const playerIDs = players
        .map((row) => Number(row.id))
        .sort((a, b) => a - b);
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
        const snapletConfig = `
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
          snapletConfig,
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
        const snapletConfig = `
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
          snapletConfig,
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

    describe("keys", () => {
      test("with single columns nullable with unique null not distinct set", async () => {
        const schema = `
            CREATE TABLE "Match" (
              "teamId" integer,
              "gameId" integer,
              "score" integer NOT NULL,
              UNIQUE NULLS NOT DISTINCT ("teamId")
            );
          `;

        const { db } = await setupProject({
          adapter,
          databaseSchema: schema,
          seedScript: `
            import { createSeedClient } from '#seed'
            import {copycat} from '@snaplet/copycat'

            const seed = await createSeedClient({ dryRun: false })
            // There is maximum 2 possible combinations of nulls not distinct
            await seed.matches((x) => x(2, 
              () => ({
                teamId: ({seed}) => copycat.oneOf(seed, [null, 1]),
              })
            ))
          `,
        });

        // Perform the queries and assertions
        const matches = await db.query<{
          gameId: null | number;
          score: number;
          teamId: null | number;
        }>('SELECT * FROM "Match" ORDER BY "score"');
        expect(matches.length).toEqual(2);

        expect(matches).toEqual(
          expect.arrayContaining([
            {
              teamId: 1,
              gameId: expect.any(Number),
              score: expect.any(Number),
            },
            {
              teamId: null,
              gameId: expect.any(Number),
              score: expect.any(Number),
            },
          ]),
        );
      });
      test("with single columns nullable with unique null not distinct set and too many error", async () => {
        const schema = `
            CREATE TABLE "Match" (
              "teamId" integer,
              "gameId" integer,
              "score" integer NOT NULL,
              UNIQUE NULLS NOT DISTINCT ("teamId")
            );
          `;

        await expect(() =>
          setupProject({
            adapter,
            databaseSchema: schema,
            seedScript: `
            import { createSeedClient } from '#seed'
            import {copycat} from '@snaplet/copycat'

            const seed = await createSeedClient({ dryRun: false })
            // There is maximum 2 possible combinations of nulls not distinct this should fail
            await seed.matches((x) => x(3, 
              () => ({
                teamId: ({seed}) => copycat.oneOf(seed, [null, 1]),
              })
            ))
          `,
          }),
        ).rejects.toThrow(
          `Unique constraint "Match_teamId_key" violated for model "matches" on fields (teamId)`,
        );
      });
      test("with multi columns nullable with unique null not distinct set", async () => {
        const schema = `
            CREATE TABLE "Match" (
              "teamId" integer,
              "gameId" integer,
              "score" integer NOT NULL,
              UNIQUE NULLS NOT DISTINCT ("teamId", "gameId")
            );
          `;

        const { db } = await setupProject({
          adapter,
          databaseSchema: schema,
          seedScript: `
            import { createSeedClient } from '#seed'
            import {copycat} from '@snaplet/copycat'

            const seed = await createSeedClient({ dryRun: false })
            // There is maximum 4 possible combinations of nulls not distinct
            await seed.matches((x) => x(4, 
              () => ({
                teamId: ({seed}) => copycat.oneOf(seed, [null, 1]),
                gameId: ({seed}) => copycat.oneOf(seed, [null, 1]),
              })
            ))
          `,
        });

        // Perform the queries and assertions
        const matches = await db.query<{
          gameId: null | number;
          score: number;
          teamId: null | number;
        }>('SELECT * FROM "Match" ORDER BY "score"');
        expect(matches.length).toEqual(4);

        expect(matches).toEqual([
          { teamId: null, gameId: null, score: expect.any(Number) },
          { teamId: 1, gameId: 1, score: expect.any(Number) },
          { teamId: 1, gameId: null, score: expect.any(Number) },
          { teamId: null, gameId: 1, score: expect.any(Number) },
        ]);
      });
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
            import { createSeedClient } from '#seed'
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
            import { createSeedClient } from '#seed'
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
        const teamIDs = teams
          .map((team) => Number(team.id))
          .sort((a, b) => a - b);
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
          import { createSeedClient } from '#seed'
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
    });
  },
  {
    timeout: 45000,
  },
);
