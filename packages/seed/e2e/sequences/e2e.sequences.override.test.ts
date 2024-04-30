import { test as _test, type TestFunction, expect } from "vitest";
import { adapterEntries } from "#test/adapters.js";
import { setupProject } from "#test/setupProject.js";
import { type DialectRecordWithDefault } from "#test/types.js";

for (const [dialect, adapter] of adapterEntries) {
  const computeName = (name: string) =>
    `e2e > sequences > ${dialect} > ${name}`;
  const test = (name: string, fn: TestFunction) => {
    // eslint-disable-next-line vitest/expect-expect, vitest/valid-title
    _test.concurrent(computeName(name), fn);
  };
  test("generates valid sequences", async () => {
    const schema: DialectRecordWithDefault = {
      default: `
        CREATE TABLE team (
          id SERIAL PRIMARY KEY
        );
        CREATE TABLE player (
          id BIGSERIAL PRIMARY KEY,
          team_id INTEGER NOT NULL REFERENCES team(id),
          name TEXT NOT NULL
        );
        CREATE TABLE game (
          id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY
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
        await seed.games((x) => x(3));
        // We declare games twice so that the second declaration should continue the sequence
        await seed.games((x) => x(3));
      `,
    });

    const teams = await db.query<{ id: number }>("SELECT * FROM team");
    const players = await db.query<{
      id: number;
      name: string;
      team_id: number;
    }>("SELECT * FROM player");
    const games = await db.query<{ id: number }>("SELECT * FROM game");
    expect(teams.length).toEqual(2); // Expected number of teams
    expect(players.length).toEqual(6); // Expected number of players
    expect(games.length).toEqual(6); // Expected number of games

    const teamIDs = teams.map((row) => Number(row.id)).sort((a, b) => a - b);
    const playerIDs = players
      .map((row) => Number(row.id))
      .sort((a, b) => a - b);
    const gameIDs = games.map((row) => Number(row.id)).sort((a, b) => a - b);

    expect(teamIDs).toEqual([1, 2]);
    expect(playerIDs).toEqual([1, 2, 3, 4, 5, 6]);
    expect(gameIDs).toEqual([1, 2, 3, 4, 5, 6]);
  });
  test("should be able to override sequences", async () => {
    const schema: DialectRecordWithDefault = {
      default: `
        CREATE TABLE team (
          id SERIAL PRIMARY KEY
        );
        CREATE TABLE player (
          id BIGSERIAL PRIMARY KEY,
          team_id INTEGER NOT NULL REFERENCES team(id),
          name TEXT NOT NULL
        );
        CREATE TABLE game (
          id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY
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
      `,
    };
    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
        import { createSeedClient } from '#snaplet/seed'
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

    const teams = await db.query<{ id: number }>("SELECT * FROM team");
    const players = await db.query<{
      id: number;
      name: string;
      team_id: number;
    }>("SELECT * FROM player");
    const games = await db.query<{ id: number }>("SELECT * FROM game");
    expect(teams.length).toEqual(2); // Expected number of teams
    expect(players.length).toEqual(6); // Expected number of players
    expect(games.length).toEqual(6); // Expected number of games

    const teamIDs = teams.map((row) => Number(row.id)).sort((a, b) => a - b);
    const playerIDs = players
      .map((row) => Number(row.id))
      .sort((a, b) => a - b);
    const gameIDs = games.map((row) => Number(row.id)).sort((a, b) => a - b);

    expect(teamIDs).toEqual([99, 100]);
    expect(playerIDs).toEqual([95, 96, 97, 98, 99, 100]);
    expect(gameIDs).toEqual([1, 2, 3, 4, 5, 6]);
  });
  test("should be able to override sequences via models override", async () => {
    const schema: DialectRecordWithDefault = {
      default: `
          CREATE TABLE team (
            id SERIAL PRIMARY KEY
          );
          CREATE TABLE player (
            id BIGSERIAL PRIMARY KEY,
            team_id INTEGER NOT NULL REFERENCES team(id),
            name TEXT NOT NULL
          );
          CREATE TABLE game (
            id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY
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
      `,
    };
    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
        import { createSeedClient } from '#snaplet/seed'
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

    const teams = await db.query<{ id: number }>("SELECT * FROM team");
    const players = await db.query<{
      id: number;
      name: string;
      team_id: number;
    }>("SELECT * FROM player");
    const games = await db.query<{ id: number }>("SELECT * FROM game");
    expect(teams.length).toEqual(2); // Expected number of teams
    expect(players.length).toEqual(6); // Expected number of players
    expect(games.length).toEqual(6); // Expected number of games

    const teamIDs = teams.map((row) => Number(row.id)).sort((a, b) => a - b);
    const playerIDs = players
      .map((row) => Number(row.id))
      .sort((a, b) => a - b);
    const gameIDs = games.map((row) => Number(row.id)).sort((a, b) => a - b);

    expect(teamIDs).toEqual([49, 50]);
    expect(playerIDs).toEqual([95, 96, 97, 98, 99, 100]);
    expect(gameIDs).toEqual([1, 2, 3, 4, 5, 6]);
  });
}
