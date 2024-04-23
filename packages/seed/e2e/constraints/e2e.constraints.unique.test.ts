import { test as _test, type TestFunction, expect } from "vitest";
import { adapterEntries } from "#test/adapters.js";
import { setupProject } from "#test/setupProject.js";
import { type DialectRecordWithDefault } from "../../test/types.js";

for (const [dialect, adapter] of adapterEntries) {
  const computeName = (name: string) =>
    `e2e > constraints > ${dialect} > ${name}`;
  const test = (name: string, fn: TestFunction) => {
    // eslint-disable-next-line vitest/expect-expect, vitest/valid-title
    _test.concurrent(computeName(name), fn);
  };
  test("unique constraints for scalar fields", async () => {
    const schema: DialectRecordWithDefault = {
      default: `
          CREATE TABLE "user" (
            id SERIAL NOT NULL PRIMARY KEY,
            email TEXT NOT NULL UNIQUE
          );
        `,
      sqlite: `
          CREATE TABLE "user" (
            id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL UNIQUE
          );
        `,
    };
    // The test is actually to ensure that this script can run withtout throwing an error.
    // if the constraints are handled correctly, the script should run without any error.
    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
        import { createSeedClient } from '#snaplet/seed'
        import { copycat } from "@snaplet/copycat"
        const seed = await createSeedClient()
        await seed.users((x) => x(5, {
          email: (ctx) => copycat.oneOf(ctx.seed, ['a', 'b', 'c', 'd', 'e']) + '@acme.com'
        }))
        `,
    });
    // Verify that the unique constraint on the email field is respected by ensuring
    // that exactly 5 users were created, each with a unique email.
    const users = await db.query<{ email: string; id: number }>(
      'SELECT * FROM "user"',
    );
    expect(users).toHaveLength(5);

    // Optionally, check that all emails are unique
    const emails = users.map((user) => user.email);
    const uniqueEmails = new Set(emails);
    expect(uniqueEmails.size).toEqual(users.length);
  });
  test("unique constraints for default fields", async () => {
    const schema: DialectRecordWithDefault = {
      default: `
        create or replace function generate_referral_code() returns text as $$
          begin
            return substr(md5(random()::text), 0, 12);
          end;
        $$ LANGUAGE plpgsql;

        create table "user" (
          id uuid not null primary key
        );
        create table profile (
          id uuid not null primary key references "user",
          referral_code text default generate_referral_code() unique
        );
        `,
      sqlite: `
          CREATE TABLE "user" (
            id TEXT NOT NULL PRIMARY KEY
          );
          CREATE TABLE "profile" (
            id TEXT NOT NULL PRIMARY KEY REFERENCES "user"(id),
            referral_code INTEGER UNIQUE DEFAULT(RANDOM())
          );
        `,
    };
    // The test is actually to ensure that this script can run withtout throwing an error.
    // if the constraints are handled correctly, the script should run without any error.
    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
        import { createSeedClient } from '#snaplet/seed'
        const seed = await createSeedClient()
        await seed.profiles((x) => x(2))
        `,
    });
    const profiles = await db.query('SELECT * FROM "profile"');
    expect(profiles).toHaveLength(2);
  });
  test("unique constraint on nullable relationship", async () => {
    const schema: DialectRecordWithDefault = {
      default: `
        create table team (
          id serial primary key
        );
        create table player (
          id bigserial primary key,
          team_id integer references team(id) unique,
          name text not null
        );
        `,
      sqlite: `
        -- Team table
        CREATE TABLE team (
          id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT
        );
        -- Player table with unique nullable team_id
        CREATE TABLE player (
          id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          team_id INTEGER,
          name TEXT NOT NULL,
          UNIQUE(team_id),
          FOREIGN KEY (team_id) REFERENCES team(id)
        );
        `,
    };

    // Ensure the adapter and dialect are correctly initialized or passed
    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
        import { createSeedClient } from '#snaplet/seed'
        const seed = await createSeedClient({ dryRun: false })
        await seed.players((x) => x(2, {
          // Explicitly providing null
          teamId: null
        }));
        // Providing nothing, which implies null for teamId due to schema design
        await seed.players((x) => x(2));
        `,
    });

    // Verify the correct number of entries in the player table
    const players = await db.query('SELECT * FROM "player"');
    expect(players).toHaveLength(4);

    // Verify that the team table remains empty
    const teams = await db.query('SELECT * FROM "team"');
    expect(teams).toHaveLength(0);
  });
}
