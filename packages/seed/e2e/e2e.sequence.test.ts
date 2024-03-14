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
    `e2e sequence: ${dialect}`,
    () => {
      test.runIf(dialect === "postgres")(
        "generates valid sequences for tables with ids as sequences or identity",
        async () => {
          const schema: Partial<Record<"default" | Dialect, string>> = {
            postgres: `
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
        },
      );
      test("generates valid sequences", async () => {
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
            }))
            await seed.games((x) => x(3))
            // We declare games twice so that the second declaration should continue the sequence
            await seed.games((x) => x(3))
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
        expect(games.length).toEqual(6); // Expected number of games

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
        expect(gameIDs).toEqual([1, 2, 3, 4, 5, 6]);
      });
      test("should be able to override sequences", async () => {
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
          );`,
        };
        const { db } = await setupProject({
          adapter,
          databaseSchema: schema[dialect] ?? schema.default,
          seedScript: `
          import { createSeedClient } from '#seed'
            const seed = await createSeedClient({ dryRun: false })
            let i = 100;
            let j = 100;
            await seed.teams((x) => x(2, {
              id: () => i--,
              players: (x) => x(3, { id: () => j-- })
            }))
            await seed.games((x) => x(3))
            // We declare games twice so that the second declaration should continue the sequence
            await seed.games((x) => x(3))
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
        expect(games.length).toEqual(6); // Expected number of games

        const teamIDs = teams
          .map((row) => Number(row.id))
          .sort((a, b) => a - b);
        const playerIDs = players
          .map((row) => Number(row.id))
          .sort((a, b) => a - b);
        const gameIDs = games
          .map((row) => Number(row.id))
          .sort((a, b) => a - b);

        expect(teamIDs).toEqual([99, 100]);
        expect(playerIDs).toEqual([95, 96, 97, 98, 99, 100]);
        expect(gameIDs).toEqual([1, 2, 3, 4, 5, 6]);
      });
      test("should be able to override sequences via models override", async () => {
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
          );`,
        };
        const { db } = await setupProject({
          adapter,
          databaseSchema: schema[dialect] ?? schema.default,
          seedScript: `
          import { createSeedClient } from '#seed'
          let i = 100
          let j = 100
          let e = 50
          const seed = await createSeedClient({
            models: {
              teams: { data: { id: () => i-- } },
              players: { data: { id: () => j-- } },
            },
          })
          await seed.teams((x) =>
            x(2, () => {
              return {
                // The teams id this should be the sequence used
                id: () => e--,
                players: (x) => x(3),
              }
            })
          )
          await seed.games((x) => x(3))
          // We declare games twice so that the second declaration should continue the sequence
          await seed.games((x) => x(3))
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
        expect(games.length).toEqual(6); // Expected number of games

        const teamIDs = teams
          .map((row) => Number(row.id))
          .sort((a, b) => a - b);
        const playerIDs = players
          .map((row) => Number(row.id))
          .sort((a, b) => a - b);
        const gameIDs = games
          .map((row) => Number(row.id))
          .sort((a, b) => a - b);

        expect(teamIDs).toEqual([49, 50]);
        expect(playerIDs).toEqual([95, 96, 97, 98, 99, 100]);
        expect(gameIDs).toEqual([1, 2, 3, 4, 5, 6]);
      });
      test("should update sequences value according to inserted data", async () => {
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
          );`,
        };
        const { db } = await setupProject({
          adapter,
          databaseSchema: schema[dialect] ?? schema.default,
          seedScript: `
          import { createSeedClient } from '#seed'
          const seed = await createSeedClient()
          await seed.teams((x) => x(2, {
            players: (x) => x(3)
          }));
          await seed.games((x) => x(3));
          `,
        });

        // Should be able to insert a new Player with the default database `nextval` call
        await db.run(
          `INSERT INTO "Player" ("teamId", name) VALUES (1, 'test')`,
        );
        expect(
          (
            await db.query<{ id: number; name: string; teamId: number }>(
              `SELECT id, name, "teamId" FROM "Player" WHERE name = 'test'`,
            )
          ).map((v) => ({ ...v, id: Number(v.id) })),
        ).toEqual([{ id: 7, name: "test", teamId: 1 }]);
      });
      // TODO: allow to progamatically continue the sequence without having to regenerate the client
      // something like seed.$introspect() that would update the dataModel and call seed.$reset()
      test(
        "should be able to insert sequential data twice regenerating the client in between",
        async () => {
          const seedScript = `
        import { createSeedClient } from '#seed'
        const seed = await createSeedClient()
        await seed.teams((x) => x(2, {
          players: (x) => x(3)
        }));
        await seed.games((x) => x(3));`;
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
          );`,
          };
          const { db, connectionString } = await setupProject({
            adapter,
            databaseSchema: schema[dialect] ?? schema.default,
            seedScript,
          });

          // Should be able to insert a new Player with the default database `nextval` call
          await db.run(
            `INSERT INTO "Player" ("teamId", name) VALUES (1, 'test')`,
          );
          // Should be able to run the seed script again
          await setupProject({
            adapter,
            connectionString,
            seedScript,
          });

          expect(
            (
              await db.query<{ id: number; name: string; teamId: number }>(
                `SELECT * FROM "Player"`,
              )
            ).length,
          ).toEqual(13);
        },
        { timeout: 70000 },
      );
    },
    {
      timeout: 45000,
    },
  );
}
