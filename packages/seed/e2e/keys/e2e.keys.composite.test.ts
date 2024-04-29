import { test as _test, type TestFunction, expect } from "vitest";
import { adapterEntries } from "#test/adapters.js";
import { setupProject } from "#test/setupProject.js";
import { type DialectRecordWithDefault } from "#test/types.js";

for (const [dialect, adapter] of adapterEntries) {
  const computeName = (name: string) => `e2e > keys > ${dialect} > ${name}`;
  const test = (name: string, fn: TestFunction) => {
    // eslint-disable-next-line vitest/expect-expect, vitest/valid-title
    _test.concurrent(computeName(name), fn);
  };

  test("work as expected with composites primary keys", async () => {
    const schema: DialectRecordWithDefault = {
      default: `
        CREATE TABLE team (
          id SERIAL PRIMARY KEY
        );
        CREATE TABLE player (
          id BIGSERIAL PRIMARY KEY,
          team_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          FOREIGN KEY (team_id) REFERENCES team(id)
        );
        CREATE TABLE game (
          id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY
        );
        CREATE TABLE match (
          team_id INTEGER NOT NULL,
          game_id INTEGER NOT NULL,
          score INTEGER NOT NULL,
          PRIMARY KEY (game_id, team_id),
          FOREIGN KEY (team_id) REFERENCES team(id),
          FOREIGN KEY (game_id) REFERENCES game(id)
        );
      `,
      sqlite: `
        CREATE TABLE team (
          id INTEGER PRIMARY KEY AUTOINCREMENT
        );
        CREATE TABLE player (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          team_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          FOREIGN KEY (team_id) REFERENCES team(id)
        );
        CREATE TABLE game (
          id INTEGER PRIMARY KEY AUTOINCREMENT
        );
        CREATE TABLE match (
          team_id INTEGER NOT NULL,
          game_id INTEGER NOT NULL,
          score INTEGER NOT NULL,
          PRIMARY KEY (game_id, team_id),
          FOREIGN KEY (team_id) REFERENCES team(id),
          FOREIGN KEY (game_id) REFERENCES game(id)
        );
      `,
      mysql: `
        CREATE TABLE team (
          id INT AUTO_INCREMENT PRIMARY KEY
        );
        CREATE TABLE player (
          id INT AUTO_INCREMENT PRIMARY KEY,
          team_id INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          FOREIGN KEY (team_id) REFERENCES team(id)
        );
        CREATE TABLE game (
          id INT AUTO_INCREMENT PRIMARY KEY
        );
        CREATE TABLE \`match\` (
          team_id INT NOT NULL,
          game_id INT NOT NULL,
          score INT NOT NULL,
          PRIMARY KEY (game_id, team_id),
          FOREIGN KEY (team_id) REFERENCES team(id),
          FOREIGN KEY (game_id) REFERENCES game(id)
        );
      `,
    };
    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
        import { createSeedClient } from '#snaplet/seed'
          const seed = await createSeedClient({ dryRun: false })
          await seed.teams((x) => x(2, {
            players: (x) => x(3)
          }));
          // Assuming seed.matches connects matches to existing teams and games
          await seed.matches((x) => x(3), { connect: true });
        `,
    });

    const teams = await db.query<{ id: number }>("SELECT * FROM team");
    expect(teams.length).toEqual(2);
    const players = await db.query<{
      id: number;
      name: string;
      team_id: number;
    }>("SELECT * FROM player");
    expect(players.length).toEqual(6);
    const games = await db.query<{ id: number }>("SELECT * FROM game");
    expect(games.length).toEqual(3);
    const matches = await db.query<{
      game_id: number;
      score: number;
      team_id: null | number;
    }>(`SELECT * FROM ${adapter.escapeIdentifier("match")}`);
    expect(matches.length).toEqual(3);

    // Assuming db.query returns an array of objects with column names as keys
    const teamIDs = teams.map((row) => Number(row.id)).sort((a, b) => a - b);
    const playerIDs = players
      .map((row) => Number(row.id))
      .sort((a, b) => a - b);
    const gameIDs = games.map((row) => Number(row.id)).sort((a, b) => a - b);

    expect(teamIDs).toEqual([1, 2]);
    expect(playerIDs).toEqual([1, 2, 3, 4, 5, 6]);
    expect(gameIDs).toEqual([1, 2, 3]);
    // Adapt your expectation for matches to the actual data and structure you expect
    expect(matches).toEqual([
      { game_id: 1, score: expect.any(Number), team_id: 1 },
      { game_id: 2, score: expect.any(Number), team_id: 1 },
      { game_id: 3, score: expect.any(Number), team_id: 2 },
    ]);
  });

  test("work as expected with composite primary keys made by non nullable unique index", async () => {
    const schema: DialectRecordWithDefault = {
      default: `
        CREATE TABLE team (
          id SERIAL PRIMARY KEY
        );
        CREATE TABLE player (
          id BIGSERIAL PRIMARY KEY,
          team_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          FOREIGN KEY (team_id) REFERENCES team(id)
        );
        CREATE TABLE game (
          id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY
        );
        CREATE TABLE match (
          team_id INTEGER NOT NULL,
          game_id INTEGER NOT NULL,
          score INTEGER NOT NULL,
          UNIQUE (game_id, team_id),
          FOREIGN KEY (team_id) REFERENCES team(id),
          FOREIGN KEY (game_id) REFERENCES game(id)
        );
      `,
      sqlite: `
        CREATE TABLE team (
          id INTEGER PRIMARY KEY AUTOINCREMENT
        );
        CREATE TABLE player (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          team_id INTEGER NOT NULL,
          name TEXT NOT NULL,
          FOREIGN KEY (team_id) REFERENCES team(id)
        );
        CREATE TABLE game (
          id INTEGER PRIMARY KEY AUTOINCREMENT
        );
        CREATE TABLE match (
          team_id INTEGER NOT NULL,
          game_id INTEGER NOT NULL,
          score INTEGER NOT NULL,
          UNIQUE (game_id, team_id),
          FOREIGN KEY (team_id) REFERENCES team(id),
          FOREIGN KEY (game_id) REFERENCES game(id)
        );
      `,
      mysql: `
        CREATE TABLE team (
          id INT AUTO_INCREMENT PRIMARY KEY
        );
        CREATE TABLE player (
          id INT AUTO_INCREMENT PRIMARY KEY,
          team_id INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          FOREIGN KEY (team_id) REFERENCES team(id)
        );
        CREATE TABLE game (
          id INT AUTO_INCREMENT PRIMARY KEY
        );
        CREATE TABLE \`match\` (
          team_id INT NOT NULL,
          game_id INT NOT NULL,
          score INT NOT NULL,
          UNIQUE (game_id, team_id),
          FOREIGN KEY (team_id) REFERENCES team(id),
          FOREIGN KEY (game_id) REFERENCES game(id)
        );
      `,
    };
    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
          import { createSeedClient } from '#snaplet/seed'
          const seed = await createSeedClient({ dryRun: false })
          await seed.teams((x) => x(2, {
            players: (x) => x(3)
          }));
          // Assuming seed.matches attempts to connect matches to existing teams and games
          await seed.matches((x) => x(3), { connect: true });
        `,
    });

    // Perform the queries and assertions similar to the previous tests
    const teams = await db.query<{ id: number }>("SELECT * FROM team");
    expect(teams.length).toEqual(2);
    const players = await db.query<{
      id: number;
      name: string;
      team_id: number;
    }>("SELECT * FROM player");
    expect(players.length).toEqual(6);
    const games = await db.query<{ id: number }>("SELECT * FROM game");
    expect(games.length).toEqual(3);
    const matches = await db.query<{
      game_id: number;
      score: number;
      team_id: null | number;
    }>(`SELECT * FROM ${adapter.escapeIdentifier("match")}`);
    expect(matches.length).toEqual(3);

    const teamIDs = teams.map((row) => Number(row.id)).sort((a, b) => a - b);
    const playerIDs = players
      .map((row) => Number(row.id))
      .sort((a, b) => a - b);
    expect(teamIDs).toEqual([1, 2]);
    expect(playerIDs).toEqual([1, 2, 3, 4, 5, 6]);
    expect(matches).toEqual([
      { game_id: 1, score: expect.any(Number), team_id: 1 },
      { game_id: 2, score: expect.any(Number), team_id: 1 },
      { game_id: 3, score: expect.any(Number), team_id: 2 },
    ]);
  });

  test("work as expected with composite primary keys made by nullable unique index", async () => {
    const schema: DialectRecordWithDefault = {
      default: `
      CREATE TABLE team (
        "id" SERIAL PRIMARY KEY
          );
          CREATE TABLE player (
            "id" BIGSERIAL PRIMARY KEY,
            "team_id" integer NOT NULL REFERENCES "team"("id"),
            "name" text NOT NULL
          );
          CREATE TABLE game (
            "id" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY
          );
          CREATE TABLE match (
            "team_id" integer REFERENCES "team"("id"),
            "game_id" integer REFERENCES "game"("id"),
            "score" integer NOT NULL,
            UNIQUE ("team_id", "game_id")
          );
        `,
      sqlite: `
          CREATE TABLE "team" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT
          );
          CREATE TABLE "player" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "team_id" INTEGER NOT NULL,
            "name" TEXT NOT NULL,
            FOREIGN KEY ("team_id") REFERENCES "team"("id")
          );
          CREATE TABLE "game" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT
          );
          -- Adjusted Match table for SQLite, explicitly allowing NULLs in composite unique keys
          CREATE TABLE "match" (
            "team_id" INTEGER,
            "game_id" INTEGER,
            "score" INTEGER NOT NULL,
            FOREIGN KEY ("team_id") REFERENCES "team"("id"),
            FOREIGN KEY ("game_id") REFERENCES "game"("id"),
            UNIQUE ("team_id", "game_id")
          );
        `,
      mysql: `
          CREATE TABLE team (
            id INT AUTO_INCREMENT PRIMARY KEY
          );
          CREATE TABLE player (
            id INT AUTO_INCREMENT PRIMARY KEY,
            team_id INT NOT NULL,
            name VARCHAR(255) NOT NULL,
            FOREIGN KEY (team_id) REFERENCES team(id)
          );
          CREATE TABLE game (
            id INT AUTO_INCREMENT PRIMARY KEY
          );
          CREATE TABLE \`match\` (
            team_id INT,
            game_id INT,
            score INT NOT NULL,
            UNIQUE (game_id, team_id),
            FOREIGN KEY (team_id) REFERENCES team(id),
            FOREIGN KEY (game_id) REFERENCES game(id)
          );
        `,
    };
    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
          import { createSeedClient } from '#snaplet/seed'
          const seed = await createSeedClient({ dryRun: false })
          await seed.teams((x) => x(2, {
            players: (x) => x(3)
          }));
          await seed.matches((x) => x(3), { connect: true });
        `,
    });

    // Perform the queries and assertions
    const teams = await db.query<{ id: number }>("SELECT * FROM team");
    expect(teams.length).toEqual(2);
    const players = await db.query<{
      id: number;
      name: string;
      team_id: number;
    }>("SELECT * FROM player");
    expect(players.length).toEqual(6);
    const games = await db.query<{ id: number }>("SELECT * FROM game");
    // Expected to have no games inserted; adjust based on seed logic
    expect(games.length).toEqual(0);
    const matches = await db.query<{
      game_id: null | number;
      score: number;
      team_id: null | number;
    }>(`SELECT * FROM ${adapter.escapeIdentifier("match")} ORDER BY "score"`);
    expect(matches.length).toEqual(3);

    // Assertions for IDs and matches according to your test setup
    const teamIDs = teams.map((team) => Number(team.id)).sort((a, b) => a - b);
    const playerIDs = players
      .map((player) => Number(player.id))
      .sort((a, b) => a - b);
    expect(teamIDs).toEqual([1, 2]);
    expect(playerIDs).toEqual([1, 2, 3, 4, 5, 6]);

    // Only in postgres dialect it's possible for a table to have no primary key or UNIQUE NON NULLABLE index
    // on sqlite we'll always fallback on the table rowid and be able to do the connection
    if (dialect === "postgres" || dialect === "mysql") {
      // Matches will have null values for teamId and gameId due to the fact there is not PK on this table to perform subsequent UPDATE
      expect(matches).toEqual([
        { team_id: null, game_id: null, score: expect.any(Number) },
        { team_id: null, game_id: null, score: expect.any(Number) },
        { team_id: null, game_id: null, score: expect.any(Number) },
      ]);
    } else {
      expect(matches).toEqual([
        {
          team_id: expect.any(Number),
          game_id: null,
          score: expect.any(Number),
        },
        {
          team_id: expect.any(Number),
          game_id: null,
          score: expect.any(Number),
        },
        {
          team_id: expect.any(Number),
          game_id: null,
          score: expect.any(Number),
        },
      ]);
    }
  });
}
