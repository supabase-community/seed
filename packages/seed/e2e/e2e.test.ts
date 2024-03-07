import { describe, expect, test } from "vitest";
import { type Dialect, adaptersByDialect } from "#test/adaptersByDialect.js";
import { setupProject } from "#test/setupProject.js";

for (const dialect of Object.keys(adaptersByDialect) as Array<Dialect>) {
  const adapter = await adaptersByDialect[dialect]();

  describe(dialect, () => {
    test("generates without a snaplet account", async () => {
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

      expect((await db.query('select * from "Organization"')).length).toEqual(2);
      expect((await db.query('select * from "Member"')).length).toEqual(6);
    });
  });
}
