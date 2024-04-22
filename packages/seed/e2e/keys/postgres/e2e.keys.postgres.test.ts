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
          import { createSeedClient } from '#snaplet/seed'
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
          import { createSeedClient } from '#snaplet/seed'
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
          import { createSeedClient } from '#snaplet/seed'
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
}
