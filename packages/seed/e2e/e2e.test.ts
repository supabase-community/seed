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
          import { createSeedClient, end } from '#seed'

          const seed = await createSeedClient()
          await seed.organizations((x) => x(2, {
            members: (x) => x(3)
          }))

          await end()
        `,
        });

        expect((await db.query('select * from "Organization"')).length).toEqual(
          2,
        );
        expect((await db.query('select * from "Member"')).length).toEqual(6);
      });
    },
    {
      timeout: 45000,
    },
  );
}
