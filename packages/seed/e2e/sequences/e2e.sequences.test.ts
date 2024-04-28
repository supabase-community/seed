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

  test("should update sequences value according to inserted data", async () => {
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
        );`,
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
        const seed = await createSeedClient()
        await seed.teams((x) => x(2, {
          players: (x) => x(3)
        }));
        await seed.games((x) => x(3));
        `,
    });

    // Should be able to insert a new Player with the default database `nextval` call
    await db.execute(`INSERT INTO player (team_id, name) VALUES (1, 'test')`);
    expect(
      (
        await db.query<{ id: number; name: string; team_id: number }>(
          `SELECT id, name, team_id FROM player WHERE name = 'test'`,
        )
      ).map((v) => ({ ...v, id: Number(v.id) })),
    ).toEqual([{ id: 7, name: "test", team_id: 1 }]);
  });

  test("should be able to insert sequential data twice with external insertions in between", async () => {
    const seedScript = `
    import { createSeedClient } from '#snaplet/seed'
    const seed = await createSeedClient()
    await seed.teams((x) => x(2, {
      players: (x) => x(3)
    }));
    await seed.games((x) => x(3));
    // Execute raw SQL to simulate external insertions
    // @ts-ignore hidden property
    await seed.db.execute("INSERT INTO player (team_id, name) VALUES (1, 'test')");
    // @ts-ignore hidden property
    await seed.$syncDatabase();
    await seed.teams((x) => x(2, {
      players: (x) => x(3)
    }));
    await seed.games((x) => x(3));
    `;
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
      );`,
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
      seedScript,
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
    });

    expect(
      (
        await db.query<{ id: number; name: string; team_id: number }>(
          `SELECT * FROM player`,
        )
      ).length,
    ).toEqual(13);
  });

  test("should be able to keep up with $resetDatabase", async () => {
    const schema: DialectRecordWithDefault = {
      default: `
        CREATE TABLE team (
          id SERIAL PRIMARY KEY
        );
        CREATE TABLE game (
          id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY
        );
      `,
      sqlite: `
        CREATE TABLE team (
          id INTEGER PRIMARY KEY AUTOINCREMENT
        );
        CREATE TABLE game (
          id INTEGER PRIMARY KEY AUTOINCREMENT
        );
      `,
      mysql: `
        CREATE TABLE team (
          id INT AUTO_INCREMENT PRIMARY KEY
        );
        CREATE TABLE game (
          id INT AUTO_INCREMENT PRIMARY KEY
        );
      `,
    };
    const seedScript = `
      import { createSeedClient } from "#snaplet/seed";
      const seed = await createSeedClient();
  
      await seed.teams((x) => x(5));
      await seed.games((x) => x(10));
  
      await seed.$resetDatabase(['!*team']);
  
      await seed.teams((x) => x(2));
      await seed.games((x) => x(4));
    `;
    const { db } = await setupProject({
      seedScript,
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
    });

    expect(
      (await db.query<{ id: number }>(`SELECT id FROM team`)).map((p) => p.id),
    ).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(
      (await db.query<{ id: number }>(`SELECT id FROM game`)).map((p) => p.id),
    ).toEqual([1, 2, 3, 4]);
  });

  if (dialect === "postgres") {
    test("generates valid sequences for tables same name and sequences on different schemas", async () => {
      const { db } = await setupProject({
        adapter,
        databaseSchema: `
          CREATE TABLE public."course" (
            "id" SERIAL PRIMARY KEY,
            "idd" INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL
          );
          CREATE SCHEMA private;
          CREATE TABLE private."course" (
            "id" SERIAL PRIMARY KEY,
            "idd" INTEGER GENERATED ALWAYS AS IDENTITY NOT NULL
          );
        `,
        seedScript: `
          import { createSeedClient } from '#snaplet/seed'
            const seed = await createSeedClient({ dryRun: false })
            await seed.publicCourses((x) => x(2));
            await seed.privateCourses((x) => x(2));
          `,
      });

      const publicCourses = await db.query<{ id: number; idd: number }>(
        'SELECT * FROM public."course"',
      );
      const publicCourseIDs = publicCourses
        .map((row) => Number(row.id))
        .sort((a, b) => a - b);
      const publicCourseIDDs = publicCourses
        .map((row) => Number(row.idd))
        .sort((a, b) => a - b);

      expect(publicCourseIDs).toEqual([1, 2]);
      expect(publicCourseIDDs).toEqual([1, 2]);
      const privateCourses = await db.query<{ id: number; idd: number }>(
        'SELECT * FROM private."course"',
      );
      const privateCourseIDs = privateCourses
        .map((row) => Number(row.id))
        .sort((a, b) => a - b);
      const privateCourseIDDs = privateCourses
        .map((row) => Number(row.idd))
        .sort((a, b) => a - b);

      expect(privateCourseIDs).toEqual([1, 2]);
      expect(privateCourseIDDs).toEqual([1, 2]);
    });

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
        import { createSeedClient } from '#snaplet/seed'
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
  }
}
