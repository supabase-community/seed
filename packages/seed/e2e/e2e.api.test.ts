import { describe, expect, test } from "vitest";
import { type Dialect, adapters } from "#test/adapters.js";
import { setupProject } from "#test/setupProject.js";

for (const dialect of Object.keys(adapters) as Array<Dialect>) {
  const adapter = await adapters[dialect]();

  describe.concurrent(
    `e2e: api: ${dialect}`,
    () => {
      test("seed.$reset works as expected", async () => {
        const schema: Partial<Record<"default" | Dialect, string>> = {
          default: `
            CREATE TABLE "user" (
              "id" SERIAL PRIMARY KEY,
              "email" text NOT NULL
            );
          `,
          sqlite: `
            CREATE TABLE "user" (
              "id" INTEGER PRIMARY KEY AUTOINCREMENT,
              "email" text NOT NULL
            );
            `,
        };

        const { db } = await setupProject({
          adapter,
          databaseSchema: schema[dialect] ?? schema.default,
          seedScript: `
          import { createSeedClient } from "#seed"

          const seed = await createSeedClient()
          await seed.users((x) => x(2))

          seed.$reset()

          try {
            await seed.users((x) => x(2))
          } catch (e) {
            console.log(e)
          }
        `,
        });

        // Check if the tables have been populated with the correct number of entries
        expect((await db.query('SELECT * FROM "user"')).length).toEqual(2);
      });

      test("seed.$transaction works as expected", async () => {
        const schema: Partial<Record<"default" | Dialect, string>> = {
          default: `
            CREATE TABLE "user" (
              "id" SERIAL PRIMARY KEY,
              "email" text NOT NULL
            );
          `,
          sqlite: `
            CREATE TABLE "user" (
              "id" INTEGER PRIMARY KEY AUTOINCREMENT,
              "email" text NOT NULL
            );
            `,
        };

        const { db } = await setupProject({
          adapter,
          databaseSchema: schema[dialect] ?? schema.default,
          seedScript: `
          import { createSeedClient } from "#seed"

          const seed = await createSeedClient()
          await seed.$transaction(async (seed) => {
            await seed.users((x) => x(3))
          })

          try {
            await seed.users((x) => x(3))
          } catch (e) {
            console.log(e)
          }
        `,
        });

        // Check if the tables have been populated with the correct number of entries
        expect((await db.query('SELECT * FROM "user"')).length).toEqual(3);
      });

      test("async column generate callbacks", async () => {
        const { db } = await setupProject({
          adapter,
          databaseSchema: `
          CREATE TABLE "User" (
            "id" uuid not null,
            "fullName" text not null
          );
        `,
          seedScript: `
          import { createSeedClient } from '#seed'
          const seed = await createSeedClient()
          await seed.users([{
            fullName: () => Promise.resolve('Foo Bar')
          }])
        `,
        });

        const [{ fullName }] = await db.query<{ fullName: string }>(
          'select * from "User"',
        );

        expect(fullName).toEqual("Foo Bar");
      });

      describe("$resetDatabase", () => {
        test("should reset all tables per default", async () => {
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
                "teamId" integer NOT NULL REFERENCES "Team"("id"),
                "name" text NOT NULL
              );
              CREATE TABLE "Game" (
                "id" INTEGER PRIMARY KEY AUTOINCREMENT
              );
            `,
          };

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
            databaseSchema: schema[dialect] ?? schema.default,
            seedScript,
          });
          expect((await db.query('SELECT * FROM "Player"')).length).toEqual(6);
          expect((await db.query('SELECT * FROM "Team"')).length).toEqual(2);
          expect((await db.query('SELECT * FROM "Game"')).length).toEqual(3);
          // Should be able to re-run the seed script again thanks to the $resetDatabase
          await runSeedScript(seedScript);
          expect((await db.query('SELECT * FROM "Player"')).length).toEqual(6);
          expect((await db.query('SELECT * FROM "Team"')).length).toEqual(2);
          expect((await db.query('SELECT * FROM "Game"')).length).toEqual(3);
        });

        test("should not reset config excluded table", async () => {
          const schema: Partial<Record<"default" | Dialect, string>> = {
            default: `
              CREATE TABLE "A" (
                "id" SERIAL PRIMARY KEY
              );

              CREATE TABLE "B" (
                "id" SERIAL PRIMARY KEY
              );
            `,
            sqlite: `
              CREATE TABLE "A" (
                "id" INTEGER PRIMARY KEY AUTOINCREMENT
              );
              CREATE TABLE "B" (
                "id" INTEGER PRIMARY KEY AUTOINCREMENT
              );
            `,
          };

          const seedConfig: Partial<Record<"default" | Dialect, string>> = {
            default: `
              import { defineConfig } from "@snaplet/seed/config";

              export default defineConfig({
                select: {
                  "B": false,
                },
              })
            `,
            postgres: `
              import { defineConfig } from "@snaplet/seed/config";

              export default defineConfig({
                select: {
                  "public.B": false,
                },
              })
            `,
          };

          const { db, runSeedScript } = await setupProject({
            adapter,
            seedConfig: seedConfig[dialect] ?? seedConfig.default,
            databaseSchema: schema[dialect] ?? schema.default,
          });

          await db.run(`INSERT INTO "A" DEFAULT VALUES`);
          await db.run(`INSERT INTO "A" DEFAULT VALUES`);

          await db.run(`INSERT INTO "B" DEFAULT VALUES`);
          await db.run(`INSERT INTO "B" DEFAULT VALUES`);

          await runSeedScript(`
            import { createSeedClient } from '#seed'

            const seed = await createSeedClient()
            await seed.$resetDatabase()
          `);

          expect((await db.query('SELECT * FROM "A"')).length).toBe(0);
          expect((await db.query('SELECT * FROM "B"')).length).toBe(2);
        });
      });
    },
    {
      timeout: 45000,
    },
  );
}
