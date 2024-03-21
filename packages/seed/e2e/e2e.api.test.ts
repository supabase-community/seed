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
        test.only("reset tables even if there is data with foreign keys in it", async () => {
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
            
                CONSTRAINT "Password_pkey" PRIMARY KEY ("id")
            );
            
            -- CreateTable
            CREATE TABLE "Board" (
                "id" SERIAL NOT NULL,
                "name" TEXT NOT NULL,
                "color" TEXT NOT NULL DEFAULT '#e0e0e0',
                "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "accountId" TEXT NOT NULL,
            
                CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
            );
            
            -- CreateTable
            CREATE TABLE "Column" (
                "id" TEXT NOT NULL,
                "name" TEXT NOT NULL,
                "order" DOUBLE PRECISION NOT NULL DEFAULT 0,
                "boardId" INTEGER NOT NULL,
            
                CONSTRAINT "Column_pkey" PRIMARY KEY ("id")
            );
            
            -- CreateTable
            CREATE TABLE "Item" (
                "id" TEXT NOT NULL,
                "title" TEXT NOT NULL,
                "content" TEXT,
                "order" DOUBLE PRECISION NOT NULL,
                "columnId" TEXT NOT NULL,
                "boardId" INTEGER NOT NULL,
            
                CONSTRAINT "Item_pkey" PRIMARY KEY ("id")
            );
            
            -- CreateIndex
            CREATE UNIQUE INDEX "Account_email_key" ON "Account"("email");
            
            -- CreateIndex
            CREATE UNIQUE INDEX "Password_accountId_key" ON "Password"("accountId");
            
            -- AddForeignKey
            ALTER TABLE "Password" ADD CONSTRAINT "Password_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
            
            -- AddForeignKey
            ALTER TABLE "Board" ADD CONSTRAINT "Board_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
            
            -- AddForeignKey
            ALTER TABLE "Column" ADD CONSTRAINT "Column_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            
            -- AddForeignKey
            ALTER TABLE "Item" ADD CONSTRAINT "Item_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "Column"("id") ON DELETE CASCADE ON UPDATE CASCADE;
            
            -- AddForeignKey
            ALTER TABLE "Item" ADD CONSTRAINT "Item_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;            
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
            
            -- CreateTable
            CREATE TABLE "Board" (
                "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                "name" TEXT NOT NULL,
                "color" TEXT NOT NULL DEFAULT '#e0e0e0',
                "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "accountId" TEXT NOT NULL,
                CONSTRAINT "Board_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "Account" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
            );
            
            -- CreateTable
            CREATE TABLE "Column" (
                "id" TEXT NOT NULL PRIMARY KEY,
                "name" TEXT NOT NULL,
                "order" REAL NOT NULL DEFAULT 0,
                "boardId" INTEGER NOT NULL,
                CONSTRAINT "Column_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board" ("id") ON DELETE CASCADE ON UPDATE CASCADE
            );
            
            -- CreateTable
            CREATE TABLE "Item" (
                "id" TEXT NOT NULL PRIMARY KEY,
                "title" TEXT NOT NULL,
                "content" TEXT,
                "order" REAL NOT NULL,
                "columnId" TEXT NOT NULL,
                "boardId" INTEGER NOT NULL,
                CONSTRAINT "Item_columnId_fkey" FOREIGN KEY ("columnId") REFERENCES "Column" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
                CONSTRAINT "Item_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
            postgres: `
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
          const insertQueries =
            `INSERT INTO "Account" (id,email) VALUES ('cc7ebf70-44ca-5e4a-a8f3-37def829095a', 'Donny.Keeling37878@likely-umbrella.net');
          INSERT INTO "Password" (id,salt,hash,"accountId") VALUES ('4a96e682-0766-5a91-8e43-faea1fb340a1', '5f60042434e43370821ae4c9f43326ed', '6c763a3edf956926e87c92e0a975098d40bf379b3a57f3039d9f08cfb9ead70cf576c55ee7fd864fa986ad07f64346dad2c23e07a1eb7922a6c05935cea20d55', 'cc7ebf70-44ca-5e4a-a8f3-37def829095a');
          INSERT INTO "Board" (id,name,color,"accountId") VALUES (1, 'Pervendibil a probes es disputarum ermittate ine patiendi.', '6a0fc0', 'cc7ebf70-44ca-5e4a-a8f3-37def829095a');
          INSERT INTO "Column" (id,name,"boardId") VALUES ('6827a539-f5d6-5ac0-b275-c2a3f0c24be4', 'Met suis docui de utramur se nihillum et, praesendum conferendae ane is cura non rerum per.', 1);
          INSERT INTO "Column" (id,name,"boardId") VALUES ('5d4b9b27-bc31-5556-a605-4199241e2601', 'Desidinvit possit ego igit efficeram assum, non philos quapropterean hoc voluptas dictas vel.', 1);
          INSERT INTO "Column" (id,name,"boardId") VALUES ('04679bf7-945f-5e5d-9570-f6b009282b6d', 'Satis ad ini de reliquid dolorum et atomi, et dicere in admodista hunc nec omore.', 1);
          INSERT INTO "Item" (id,title,content,"order","columnId","boardId") VALUES ('c26af681-3f1a-581f-8556-d5cd1db67171', 'Aliam quamquamquam romant conectam evendam.', 'Hominquam efficit et magna sapientes quia sic, rebus modi atque profecto noster ipem epicuri.', 2.0256292235877074, '6827a539-f5d6-5ac0-b275-c2a3f0c24be4', 1);
          INSERT INTO "Item" (id,title,content,"order","columnId","boardId") VALUES ('6dfdaeb1-7ad3-5df7-9b03-d32d5d3f1bb0', 'Aptior id atem consilio sine estum.', 'Epicur id parat de maxim quo a viam, ut nomines vide qui ipsi es sunt sicinant.', 0.543442901193668, '6827a539-f5d6-5ac0-b275-c2a3f0c24be4', 1);
          INSERT INTO "Item" (id,title,content,"order","columnId","boardId") VALUES ('98745b32-71c9-5d0b-ba6d-b35fdd186729', 'Contentia probab potessarum eturali quo.', 'Voluptatum utione huic nec detriment, fortitiam honest cum voluptate potes incomparvos.', 11.945413084765985, '6827a539-f5d6-5ac0-b275-c2a3f0c24be4', 1);
          INSERT INTO "Item" (id,title,content,"order","columnId","boardId") VALUES ('b16c856f-0341-552c-8e92-ac52457ede06', 'Rem alteristim vocet in semperdiscip.', 'Es ipsumus tale scriberae quodsi eosdemoccul omnis graecum.', 7.414268386783442, '5d4b9b27-bc31-5556-a605-4199241e2601', 1);
          INSERT INTO "Item" (id,title,content,"order","columnId","boardId") VALUES ('788cd0d7-9abb-5f75-867d-b32b737390d6', 'Detracta etiamsi timo dolorisse tant voluptati, multi mihi est inest eros physico per locum.', 'Eorum met intellegi ob etiam viventiamque, quamquam vix quadam natum et fieri.', 1.181133901651631, '5d4b9b27-bc31-5556-a605-4199241e2601', 1);
          INSERT INTO "Item" (id,title,content,"order","columnId","boardId") VALUES ('89f09ee1-dd12-5361-8f2a-8728afca4592', 'Romando aut quam in estias neglexerit, cupidemus lata firmam per consequatur dixi.', 'Liturus quae enime quamquam causa.', 15.780211385146849, '5d4b9b27-bc31-5556-a605-4199241e2601', 1);
          INSERT INTO "Item" (id,title,content,"order","columnId","boardId") VALUES ('aec3fbe8-5145-5c6f-899c-12c7c670e90d', 'Ini deorsum difficerne numervi latin, sit docti ea sit neque.', 'Dominanim obiecta sic habet composset.', 7.191230040631182, '04679bf7-945f-5e5d-9570-f6b009282b6d', 1);
          INSERT INTO "Item" (id,title,content,"order","columnId","boardId") VALUES ('333e5b80-934e-5317-a16e-c26970c8f33b', 'Intellegim in videbathen veniam sempernere se virtutum sine, et ignoratis nihillus fames cum es disserenim a.', 'Triarius latin cum nobis allicit.', 6.369609196435058, '04679bf7-945f-5e5d-9570-f6b009282b6d', 1);
          INSERT INTO "Item" (id,title,content,"order","columnId","boardId") VALUES ('d631eb92-812d-5e9c-ab3d-e32c83eddd7e', 'Per tentamentur se erandriam aliquant, beatus sedat domo meminum scriberratu consentio.', 'Eo consequuntur in dicertitud te, et quasi vias tamendam est abhortenen si victi.', 1.7547695324186352, '04679bf7-945f-5e5d-9570-f6b009282b6d', 1);
          `
              .split("\n")
              .map((x) => x.trim())
              .filter(Boolean);
          for (const query of insertQueries) {
            await db.execute(query);
          }

          await runSeedScript(seedScript[dialect] ?? seedScript.default);

          expect((await db.query('SELECT * FROM "Account"')).length).toBe(0);
          expect((await db.query('SELECT * FROM "Password"')).length).toBe(0);
          expect((await db.query('SELECT * FROM "Board"')).length).toBe(0);
          expect((await db.query('SELECT * FROM "Column"')).length).toBe(0);
          expect((await db.query('SELECT * FROM "Item"')).length).toBe(0);
        });
      });
    },
    {
      timeout: 50000,
    },
  );
}
