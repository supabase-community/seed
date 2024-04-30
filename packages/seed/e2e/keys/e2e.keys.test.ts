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

  test("work as expected and UPDATE children with PRIMARY KEY field", async () => {
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
          team_id INTEGER,
          game_id INTEGER NOT NULL,
          score INTEGER NOT NULL,
          PRIMARY KEY (game_id),
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
          team_id INTEGER,
          game_id INTEGER NOT NULL,
          score INTEGER NOT NULL,
          PRIMARY KEY (game_id),
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
          team_id INT,
          game_id INT NOT NULL,
          score INT NOT NULL,
          PRIMARY KEY (game_id),
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
          }))
          await seed.matches((x) => x(3), { connect: true })
        `,
    });

    // Your query and assertion logic
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

    const teamIDs = teams.map((team) => team.id).sort((a, b) => a - b);
    const playerIDs = players
      .map((player) => Number(player.id))
      .sort((a, b) => a - b);
    expect(teamIDs).toEqual([1, 2]);
    expect(playerIDs).toEqual([1, 2, 3, 4, 5, 6]);
    expect(matches).toEqual([
      { game_id: 1, score: expect.any(Number), team_id: 1 },
      { game_id: 2, score: expect.any(Number), team_id: 1 },
      { game_id: 3, score: expect.any(Number), team_id: 2 },
    ]);
  });

  test("work as expected and UPDATE children with UNIQUE NON NULLABLE field", async () => {
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
          team_id INTEGER,
          game_id INTEGER NOT NULL UNIQUE,
          score INTEGER NOT NULL,
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
          team_id INTEGER,
          game_id INTEGER NOT NULL UNIQUE,
          score INTEGER NOT NULL,
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
          team_id INT,
          game_id INT NOT NULL,
          score INT NOT NULL,
          UNIQUE(game_id),
          FOREIGN KEY (team_id) REFERENCES team(id),
          FOREIGN KEY (game_id) REFERENCES game(id)
        );
      `,
    };
    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
          import { createSeedClient } from "#snaplet/seed"
          const seed = await createSeedClient()
          await seed.teams((x) => x(2, {
            players: (x) => x(3)
          }))
          await seed.matches((x) => x(3), { connect: true })
        `,
    });

    // Your query and assertion logic
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

    // Additional assertions for ID sequences and match specifics
    const teamIDs = teams.map((team) => team.id).sort((a, b) => a - b);
    const playerIDs = players
      .map((player) => Number(player.id))
      .sort((a, b) => a - b);
    // Ensuring the "game_id" uniqueness is maintained
    expect(teamIDs).toEqual([1, 2]);
    expect(playerIDs).toEqual([1, 2, 3, 4, 5, 6]);
    expect(matches).toEqual([
      { game_id: 1, score: expect.any(Number), team_id: 1 },
      { game_id: 2, score: expect.any(Number), team_id: 1 },
      { game_id: 3, score: expect.any(Number), team_id: 2 },
    ]);
  });
  test("should handle join table relationship", async () => {
    const schema: DialectRecordWithDefault = {
      default: `
        CREATE TABLE authors (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL
        );
  
        CREATE TABLE books (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL
        );
  
        CREATE TABLE author_books (
          author_id INTEGER NOT NULL,
          book_id INTEGER NOT NULL,
          PRIMARY KEY (author_id, book_id),
          FOREIGN KEY (author_id) REFERENCES authors(id),
          FOREIGN KEY (book_id) REFERENCES books(id)
        );
      `,
      sqlite: `
        CREATE TABLE authors (
          id INTEGER NOT NULL PRIMARY KEY,
          name TEXT NOT NULL
        );
  
        CREATE TABLE books (
          id INTEGER NOT NULL PRIMARY KEY,
          title TEXT NOT NULL
        );
  
        CREATE TABLE author_books (
          author_id INTEGER NOT NULL,
          book_id INTEGER NOT NULL,
          PRIMARY KEY (author_id, book_id),
          FOREIGN KEY (author_id) REFERENCES authors(id),
          FOREIGN KEY (book_id) REFERENCES books(id)
        );
      `,
      mysql: `
        CREATE TABLE authors (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL
        );
  
        CREATE TABLE books (
          id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(255) NOT NULL
        );
  
        CREATE TABLE author_books (
          author_id INT NOT NULL,
          book_id INT NOT NULL,
          PRIMARY KEY (author_id, book_id),
          FOREIGN KEY (author_id) REFERENCES authors(id),
          FOREIGN KEY (book_id) REFERENCES books(id)
        );
      `,
    };
    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
          import { createSeedClient } from "#snaplet/seed"
          const seed = await createSeedClient()
          await seed.authors([
            {
              name: "Author One",
              authorBooks: [{book: {id: 1, title: "Book One"}}, {book: {id: 2, title: "Book Two"}}]
            },
            {
              name: "Author Two",
              authorBooks: [{bookId: 1}]
            }
          ])
        `,
    });
    const results = await db.query(`
        SELECT a.name, b.title
        FROM author_books ab
        JOIN authors a ON ab.author_id = a.id
        JOIN books b ON ab.book_id = b.id
      `);

    // Assertions to verify the join table relationships
    expect(results).toEqual(
      expect.arrayContaining([
        { name: "Author One", title: "Book One" },
        { name: "Author One", title: "Book Two" },
        { name: "Author Two", title: "Book One" },
      ]),
    );
  });
}
