import { describe, expect, test } from "vitest";
import { type Dialect, adapters } from "#test/adapters.js";
import { setupProject } from "#test/setupProject.js";

type DialectRecordWithDefault<T> = Partial<Record<Dialect, T>> &
  Record<"default", T>;
type SchemaRecord = DialectRecordWithDefault<string>;
type SeedScriptRecord = DialectRecordWithDefault<string>;
type SeedConfigRecord = DialectRecordWithDefault<
  (connectionString: string) => string
>;

for (const dialect of Object.keys(adapters) as Array<Dialect>) {
  const adapter = await adapters[dialect]();

  describe.concurrent(
    `e2e: api: ${dialect}`,
    () => {
      test("seed.$reset works as expected", async () => {
        const schema: SchemaRecord = {
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
        const schema: SchemaRecord = {
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
          const schema: SchemaRecord = {
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
          const schema: SchemaRecord = {
            default: `
              CREATE TABLE "BABBA" (
                "id" SERIAL PRIMARY KEY
              );

              CREATE TABLE "BABA" (
                "id" SERIAL PRIMARY KEY
              );
            `,
            sqlite: `
              CREATE TABLE "BABBA" (
                "id" INTEGER PRIMARY KEY AUTOINCREMENT
              );
              CREATE TABLE "BABA" (
                "id" INTEGER PRIMARY KEY AUTOINCREMENT
              );
            `,
          };

          const seedConfig: SeedConfigRecord = {
            default: (connectionString) =>
              adapter.generateSeedConfig(
                connectionString,
                `
                  select: {
                    "BABA": false,
                  },
                `,
              ),
            postgres: (connectionString) =>
              adapter.generateSeedConfig(
                connectionString,
                `
                  select: {
                    "public.BABA": false,
                  },
                `,
              ),
          };

          const { db, runSeedScript } = await setupProject({
            adapter,
            seedConfig: seedConfig[dialect] ?? seedConfig.default,
            databaseSchema: schema[dialect] ?? schema.default,
          });

          await db.execute(`INSERT INTO "BABBA" DEFAULT VALUES`);
          await db.execute(`INSERT INTO "BABBA" DEFAULT VALUES`);

          await db.execute(`INSERT INTO "BABA" DEFAULT VALUES`);
          await db.execute(`INSERT INTO "BABA" DEFAULT VALUES`);

          await runSeedScript(`
            import { createSeedClient } from '#seed'

            const seed = await createSeedClient()
            await seed.$resetDatabase()
          `);

          expect((await db.query('SELECT * FROM "BABBA"')).length).toBe(0);
          expect((await db.query('SELECT * FROM "BABA"')).length).toBe(2);
        });

        test("should not reset parameterized excluded table", async () => {
          const schema: SchemaRecord = {
            default: `
              CREATE TABLE "BABBA" (
                "id" SERIAL PRIMARY KEY
              );

              CREATE TABLE "BABA" (
                "id" SERIAL PRIMARY KEY
              );
            `,
            sqlite: `
              CREATE TABLE "BABBA" (
                "id" INTEGER PRIMARY KEY AUTOINCREMENT
              );
              CREATE TABLE "BABA" (
                "id" INTEGER PRIMARY KEY AUTOINCREMENT
              );
            `,
          };

          const seedScript: SeedScriptRecord = {
            default: `
              import { createSeedClient } from '#seed'

              const seed = await createSeedClient()
              await seed.$resetDatabase({ "BABA": false })
            `,
            postgres: `
              import { createSeedClient } from '#seed'

              const seed = await createSeedClient()
              await seed.$resetDatabase({ "public.BABA": false })
            `,
          };

          const { db, runSeedScript } = await setupProject({
            adapter,
            databaseSchema: schema[dialect] ?? schema.default,
          });

          await db.execute(`INSERT INTO "BABBA" DEFAULT VALUES`);
          await db.execute(`INSERT INTO "BABBA" DEFAULT VALUES`);

          await db.execute(`INSERT INTO "BABA" DEFAULT VALUES`);
          await db.execute(`INSERT INTO "BABA" DEFAULT VALUES`);

          await runSeedScript(seedScript[dialect] ?? seedScript.default);

          expect((await db.query('SELECT * FROM "BABBA"')).length).toBe(0);
          expect((await db.query('SELECT * FROM "BABA"')).length).toBe(2);
        });

        test("should not reset parameterized excluded table with star syntax", async () => {
          const schema: SchemaRecord = {
            default: `
              CREATE TABLE "BABBA" (
                "id" SERIAL PRIMARY KEY
              );

              CREATE TABLE "BABA" (
                "id" SERIAL PRIMARY KEY
              );
            `,
            sqlite: `
              CREATE TABLE "BABBA" (
                "id" INTEGER PRIMARY KEY AUTOINCREMENT
              );
              CREATE TABLE "BABA" (
                "id" INTEGER PRIMARY KEY AUTOINCREMENT
              );
            `,
          };

          const seedScript: SeedScriptRecord = {
            default: `
              import { createSeedClient } from '#seed'

              const seed = await createSeedClient()
              await seed.$resetDatabase({ "BA*": false })
            `,
            postgres: `
              import { createSeedClient } from '#seed'

              const seed = await createSeedClient()
              await seed.$resetDatabase({ "public.BA*": false })
            `,
          };

          const { db, runSeedScript } = await setupProject({
            adapter,
            databaseSchema: schema[dialect] ?? schema.default,
          });

          await db.execute(`INSERT INTO "BABBA" DEFAULT VALUES`);
          await db.execute(`INSERT INTO "BABBA" DEFAULT VALUES`);

          await db.execute(`INSERT INTO "BABA" DEFAULT VALUES`);
          await db.execute(`INSERT INTO "BABA" DEFAULT VALUES`);

          await runSeedScript(seedScript[dialect] ?? seedScript.default);

          expect((await db.query('SELECT * FROM "BABBA"')).length).toBe(2);
          expect((await db.query('SELECT * FROM "BABA"')).length).toBe(2);
        });

        test("should not allow to pass a table already excluded in the config", async () => {
          const tableName: SchemaRecord = {
            default: "BABA",
            postgres: "public.BABA",
          };
          const schema: SchemaRecord = {
            default: `
              CREATE TABLE "BABBA" (
                "id" SERIAL PRIMARY KEY
              );

              CREATE TABLE "BABA" (
                "id" SERIAL PRIMARY KEY
              );
            `,
            sqlite: `
              CREATE TABLE "BABBA" (
                "id" INTEGER PRIMARY KEY AUTOINCREMENT
              );
              CREATE TABLE "BABA" (
                "id" INTEGER PRIMARY KEY AUTOINCREMENT
              );
            `,
          };

          const seedConfig: SeedConfigRecord = {
            default: (connectionString) =>
              adapter.generateSeedConfig(
                connectionString,
                `
                  select: {
                    "${tableName[dialect] ?? tableName.default}": false,
                  },
                `,
              ),
            postgres: (connectionString) =>
              adapter.generateSeedConfig(
                connectionString,
                `
                  select: {
                    "${tableName[dialect] ?? tableName.default}": false,
                  },
                `,
              ),
          };

          const seedScript: SeedScriptRecord = {
            default: `
              import { createSeedClient } from '#seed'

              const seed = await createSeedClient()
              await seed.$resetDatabase({ "BABA": false })
            `,
            postgres: `
              import { createSeedClient } from '#seed'

              const seed = await createSeedClient()
              await seed.$resetDatabase({ "${tableName[dialect] ?? tableName.default}": false })
            `,
          };

          await expect(() =>
            setupProject({
              adapter,
              seedConfig: seedConfig[dialect] ?? seedConfig.default,
              databaseSchema: schema[dialect] ?? schema.default,
              seedScript: seedScript[dialect] ?? seedScript.default,
            }),
          ).rejects.toThrow(
            `'"${tableName[dialect] ?? tableName.default}"' does not exist in type 'SelectConfig'`,
          );
        });
        test("reset tables even if there is data with foreign keys in it", async () => {
          const schema: SchemaRecord = {
            default: `
              -- CreateTable
              CREATE TABLE "Account" (
                  "id" TEXT NOT NULL,
                  "email" TEXT NOT NULL,
                  CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
              );
              
              -- CreateTable
              CREATE TABLE "Password" (
                  "id" TEXT NOT NULL,
                  "salt" TEXT NOT NULL,
                  "hash" TEXT NOT NULL,
                  "accountId" TEXT NOT NULL,
                  CONSTRAINT "Password_pkey" PRIMARY KEY ("id"),
                  CONSTRAINT "Password_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE
              );
              
              -- CreateIndex
              CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email");
              
              -- CreateIndex
              CREATE UNIQUE INDEX "Password_accountId_key" ON "Password"("accountId");
            `,
            sqlite: `
              -- CreateTable
              CREATE TABLE "Account" (
                  "id" TEXT NOT NULL PRIMARY KEY,
                  "email" TEXT NOT NULL
              );
              
              -- CreateTable
              CREATE TABLE "Password" (
                  "id" TEXT NOT NULL PRIMARY KEY,
                  "salt" TEXT NOT NULL,
                  "hash" TEXT NOT NULL,
                  "accountId" TEXT NOT NULL,
                  CONSTRAINT "Password_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
              );
              
              -- CreateIndex
              CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email");
              
              -- CreateIndex
              CREATE UNIQUE INDEX "Password_accountId_key" ON "Password"("accountId");
            `,
          };

          const seedScript: SeedScriptRecord = {
            default: `
              import { createSeedClient } from '#seed'
        
              const seed = await createSeedClient()
              await seed.$resetDatabase()
            `,
          };

          const { db, runSeedScript } = await setupProject({
            adapter,
            databaseSchema: schema[dialect] ?? schema.default,
          });

          // We insert some data in our database
          await db.execute(
            `INSERT INTO "Account" (id,email) VALUES ('cc7ebf70-44ca-5e4a-a8f3-37def829095a', 'Donny.Keeling37878@likely-umbrella.net');`,
          );
          await db.execute(
            `INSERT INTO "Password" (id,salt,hash,"accountId") VALUES ('4a96e682-0766-5a91-8e43-faea1fb340a1', '1234567', '123456', 'cc7ebf70-44ca-5e4a-a8f3-37def829095a');`,
          );

          await runSeedScript(seedScript[dialect] ?? seedScript.default);

          expect((await db.query('SELECT * FROM "Account"')).length).toBe(0);
          expect((await db.query('SELECT * FROM "Password"')).length).toBe(0);
        });
      });
    },
    {
      timeout: 50000,
    },
  );
}
