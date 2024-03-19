import dedent from "dedent";
import { describe, expect, test } from "vitest";
import { type Dialect, adapters } from "#test/adapters.js";
import { setupProject } from "#test/setupProject.js";

// for (const dialect of Object.keys(adapters) as Array<Dialect>) {
for (const dialect of ["sqlite"] as Array<Dialect>) {
  const adapter = await adapters[dialect]();

  if (adapter.skipReason) {
    describe.skip(`e2e: ${dialect} (${adapter.skipReason})`, () => {
      null;
    });

    continue;
  }

  describe.concurrent(
    `e2e constraints: ${dialect}`,
    () => {
      test("unique constraints for parent fields", async () => {
        const schema: Partial<Record<"default" | Dialect, string>> = {
          default: `
          create table organization (
            id serial not null primary key
          );
          create table "user" (
            id serial not null primary key
          );
          create table member (
            id serial not null primary key,
            organization_id int not null references organization(id),
            user_id int not null references "user"(id) unique,
            unique (organization_id, user_id)
          );
          `,
          sqlite: `
          -- Organization table
          CREATE TABLE organization (
            id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT
          );
          -- User table
          CREATE TABLE "user" (
            id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT
          );
          -- Member table with unique constraints
          CREATE TABLE member (
            id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            organization_id INTEGER NOT NULL,
            user_id INTEGER NOT NULL,
            FOREIGN KEY (organization_id) REFERENCES organization(id),
            FOREIGN KEY (user_id) REFERENCES "user"(id),
            UNIQUE (user_id),
            UNIQUE (organization_id, user_id)
          );
          `,
        };
        // The test is actually to ensure that this script can run withtout throwing an error.
        // if the constraints are handled correctly, the script should run without any error.
        const { db } = await setupProject({
          adapter,
          databaseSchema: schema[dialect] ?? schema.default,
          seedScript: `
          import { createSeedClient } from '#seed'
            const seed = await createSeedClient({ dryRun: false })
            await seed.organizations((x) => x(2))
            await seed.users((x) => x(20))
            // Attempt to seed members, ensuring unique constraints are respected
            await seed.members((x) => x(20), { connect: true })
          `,
        });
        const members = await db.query('SELECT * FROM "member"');
        expect(members).toHaveLength(20);
      });
      test("unique constraints for scalar fields", async () => {
        const schema: Partial<Record<"default" | Dialect, string>> = {
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
          import { createSeedClient } from '#seed'
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
      test("error is thrown when unique constraints are violated", async () => {
        const schema: Partial<Record<"default" | Dialect, string>> = {
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
        const { runSeedScript } = await setupProject({
          adapter,
          databaseSchema: schema[dialect] ?? schema.default,
        });
        await expect(() =>
          runSeedScript(`
          import { createSeedClient } from '#seed'
          import { copycat } from "@snaplet/copycat"
          const seed = await createSeedClient()
          await seed.users((x) => x(5, {
            email: (ctx) => copycat.oneOf(ctx.seed, ['a', 'b']) + '@acme.com'
          }))`),
        ).rejects.toThrow(dedent`
          Unique constraint "user_email_key" violated for model "users" on fields (email) with values (b@acme.com)
          Seed: 0/users/2
          Model data: {
            "id": 3,
            "email": "b@acme.com"
          }`);
      });
      test("unique constraints for default fields", async () => {
        const schema: Partial<Record<"default" | Dialect, string>> = {
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
          import { createSeedClient } from '#seed'
          const seed = await createSeedClient()
          await seed.profiles((x) => x(2))
          `,
        });
        const profiles = await db.query('SELECT * FROM "profile"');
        expect(profiles).toHaveLength(2);
      });
      test("nullable relationship", async () => {
        const schema: Partial<Record<"default" | Dialect, string>> = {
          default: `
          create table team (
            id serial primary key
          );
          create table player (
            id bigserial primary key,
            team_id integer references team(id),
            name text not null
          );
          `,
          sqlite: `
          -- Team table
          CREATE TABLE team (
            id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT
          );
          -- Player table with a nullable reference to Team
          CREATE TABLE player (
            id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            team_id INTEGER,
            name TEXT NOT NULL,
            FOREIGN KEY (team_id) REFERENCES team(id)
          );
          `,
        };

        // Ensure the adapter and dialect are correctly initialized or passed
        const { db } = await setupProject({
          adapter,
          databaseSchema: schema[dialect] ?? schema.default,
          seedScript: `
          import { createSeedClient } from '#seed'
            const seed = await createSeedClient({ dryRun: false })
            // Explicitly setting team_id to null
            await seed.players((x) => x(2, {
              teamId: null // Ensure this matches your seed client's API
            }));
            // Omitting team_id
            await seed.players((x) => x(2));
          `,
        });

        // Check if the players table has been populated correctly
        const players = await db.query("SELECT * FROM player");
        expect(players).toHaveLength(4);

        // Check if the teams table remains empty
        const teams = await db.query("SELECT * FROM team");
        expect(teams).toHaveLength(0);
      });
      test("unique constraint on nullable relationship", async () => {
        const schema: Partial<Record<"default" | Dialect, string>> = {
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
          import { createSeedClient } from '#seed'
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
    },
    {
      timeout: 45000,
    },
  );
}
