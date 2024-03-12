import { describe, expect, test } from "vitest";
import { type Dialect, adapters } from "#test/adapters.js";
import { setupProject } from "#test/setupProject.js";

for (const dialect of Object.keys(adapters) as Array<Dialect>) {
  const adapter = await adapters[dialect]();

  if (adapter.skipReason) {
    describe.skip(`e2e: ${dialect} (${adapter.skipReason})`, () => {
      null;
    });

    continue;
  }

  describe(
    `e2e: ${dialect}`,
    () => {
      test("generates", async () => {
        const { db } = await setupProject({
          adapter,
          databaseSchema: `
          CREATE TABLE "Organization" (
            "id" uuid not null primary key
          );
          CREATE TABLE "Member" (
            "id" uuid not null primary key,
            "organizationId" uuid not null references "Organization"("id"),
            "name" text not null
          );
        `,
          seedScript: `
          import { createSeedClient } from '#seed'

          const seed = await createSeedClient()

          await seed.organizations((x) => x(2, {
            members: (x) => x(3)
          }))
        `,
        });

        expect((await db.query('select * from "Organization"')).length).toEqual(
          2,
        );
        expect((await db.query('select * from "Member"')).length).toEqual(6);
      });

      test("dryRun outputs sql statements to stdout", async () => {
        const { db, stdout } = await setupProject({
          adapter,
          databaseSchema: `
            CREATE TABLE "Organization" (
              "id" uuid not null primary key
            );
            CREATE TABLE "Member" (
              "id" uuid not null primary key,
              "organizationId" uuid not null references "Organization"("id"),
              "name" text not null
            );
          `,
          seedScript: `
            import { createSeedClient } from '#seed'

            const seed = await createSeedClient({ dryRun: true })

            await seed.organizations((x) => x(2, {
              members: (x) => x(3)
            }))
          `,
        });

        expect((await db.query('select * from "Organization"')).length).toEqual(
          0,
        );

        expect((await db.query('select * from "Member"')).length).toEqual(0);

        for (const statement of stdout.split(";").filter(Boolean)) {
          await db.run(statement);
        }

        expect((await db.query('select * from "Organization"')).length).toEqual(
          2,
        );

        expect((await db.query('select * from "Member"')).length).toEqual(6);
      });

      test("handle existing data in the database", async () => {
        const { db } = await setupProject({
          adapter,
          databaseSchema: `
          CREATE TABLE "Organization" (
            "id" uuid not null primary key
          );
          CREATE TABLE "Member" (
            "id" uuid not null primary key,
            "organizationId" uuid not null references "Organization"("id"),
            "name" text not null
          );
          INSERT INTO "Organization" VALUES ('18bcdaf9-afae-4b03-a7aa-203491acc950');
        `,
          seedScript: `
          import { createSeedClient } from '#seed'

          const seed = await createSeedClient()

          await seed.members((x) => x(5), { connect: { organizations: [{ id: '18bcdaf9-afae-4b03-a7aa-203491acc950' }] } })
        `,
        });

        expect((await db.query('select * from "Organization"')).length).toEqual(
          1,
        );

        expect((await db.query('select * from "Member"')).length).toEqual(5);
      });

      dialect !== "sqlite" &&
        test("generates for char limits", async () => {
          const { db } = await setupProject({
            adapter,
            databaseSchema: `
          CREATE TABLE "User" (
            "id" uuid not null,
            "fullName" varchar(5) not null
          );
        `,
            seedScript: `
          import { createSeedClient } from '#seed'
          const seed = await createSeedClient()
          await seed.users([{}])
        `,
          });

          const [{ fullName }] = await db.query<{ fullName: string }>(
            'select * from "User"',
          );
          expect(fullName.length).toBeLessThanOrEqual(5);
        });
    },
    {
      timeout: 45000,
    },
  );
}
