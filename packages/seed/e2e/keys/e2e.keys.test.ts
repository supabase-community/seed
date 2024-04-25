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
          import { createSeedClient } from '#snaplet/seed'
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
    const schema: DialectRecordWithDefault = {
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
          import { createSeedClient } from "#snaplet/seed"
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
        PRAGMA foreign_keys = ON;
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
    // This assumes your testing framework has an expect function and that
    // you're familiar with its assertion syntax. Adjust accordingly.
    expect(results).toEqual(
      expect.arrayContaining([
        { name: "Author One", title: "Book One" },
        { name: "Author One", title: "Book Two" },
        { name: "Author Two", title: "Book One" },
      ]),
    );
  });
}
