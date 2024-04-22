import { test as _test, type TestFunction, expect } from "vitest";
import { type DialectId } from "#dialects/dialects.js";
import { adapterEntries } from "#test/adapters.js";
import { setupProject } from "#test/setupProject.js";

type DialectRecordWithDefault<T> = Partial<Record<DialectId, T>> &
  Record<"default", T>;
type SchemaRecord = DialectRecordWithDefault<string>;

for (const [dialect, adapter] of adapterEntries) {
  const computeName = (name: string) => `e2e > api > ${dialect} > ${name}`;
  const test = (name: string, fn: TestFunction) => {
    // eslint-disable-next-line vitest/expect-expect, vitest/valid-title
    _test.concurrent(computeName(name), fn);
  };

  test("connect callback needs only ids", async () => {
    const schema: SchemaRecord = {
      default: `
          CREATE TABLE "User" (
            "id" serial primary key,
            "fullName" text not null
          );

          CREATE TABLE "Post" (
            "id" serial primary key,
            "userId" integer not null references "User"("id")
          );
        `,
      sqlite: `
          CREATE TABLE "User" (
            "id" integer primary key autoincrement,
            "fullName" text not null
          );

          CREATE TABLE "Post" (
            "id" integer primary key autoincrement,
            "userId" integer not null references "User"("id")
          );
        `,
    };

    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
        import { createSeedClient } from '#snaplet/seed'

        const seed = await createSeedClient()

        await seed.users(x => x(3))

        await seed.posts(x => x(3, () => ({
          user: ctx => ctx.connect(({ $store }) => ({ id: $store.users[0].id }))
        })))
      `,
    });

    const posts = await db.query<{ fullName: string }>('select * from "Post"');

    expect(posts).toEqual([
      {
        id: 1,
        userId: 1,
      },
      {
        id: 2,
        userId: 1,
      },
      {
        id: 3,
        userId: 1,
      },
    ]);
  });

  test("connect callback can receive more than just ids", async () => {
    const schema: SchemaRecord = {
      default: `
          CREATE TABLE "User" (
            "id" serial primary key,
            "fullName" text not null
          );

          CREATE TABLE "Post" (
            "id" serial primary key,
            "userId" integer not null references "User"("id")
          );
        `,
      sqlite: `
          CREATE TABLE "User" (
            "id" integer primary key autoincrement,
            "fullName" text not null
          );

          CREATE TABLE "Post" (
            "id" integer primary key autoincrement,
            "userId" integer not null references "User"("id")
          );
        `,
    };

    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
        import { createSeedClient } from '#snaplet/seed'

        const seed = await createSeedClient()

        await seed.users(x => x(3))

        await seed.posts(x => x(3, () => ({
          user: ctx => ctx.connect(({ $store }) => $store.users[0])
        })))
      `,
    });

    const posts = await db.query<{ fullName: string }>('select * from "Post"');

    expect(posts).toEqual([
      {
        id: 1,
        userId: 1,
      },
      {
        id: 2,
        userId: 1,
      },
      {
        id: 3,
        userId: 1,
      },
    ]);
  });

  test("connect option needs only ids", async () => {
    const schema: SchemaRecord = {
      default: `
          CREATE TABLE "User" (
            "id" serial primary key,
            "fullName" text not null
          );

          CREATE TABLE "Post" (
            "id" serial primary key,
            "userId" integer not null references "User"("id")
          );
        `,
      sqlite: `
          CREATE TABLE "User" (
            "id" integer primary key autoincrement,
            "fullName" text not null
          );

          CREATE TABLE "Post" (
            "id" integer primary key autoincrement,
            "userId" integer not null references "User"("id")
          );
        `,
    };

    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
        import { createSeedClient } from '#snaplet/seed'

        const seed = await createSeedClient()

        await seed.users(x => x(3))

        await seed.posts(x => x(3), {
          connect: {
            users: [{
              id: 1
            }]
          }
        })
      `,
    });

    const posts = await db.query<{ fullName: string }>('select * from "Post"');

    expect(posts).toEqual([
      {
        id: 1,
        userId: 1,
      },
      {
        id: 2,
        userId: 1,
      },
      {
        id: 3,
        userId: 1,
      },
    ]);
  });

  test("connect option can take in more than just ids", async () => {
    const schema: SchemaRecord = {
      default: `
          CREATE TABLE "User" (
            "id" serial primary key,
            "fullName" text not null
          );

          CREATE TABLE "Post" (
            "id" serial primary key,
            "userId" integer not null references "User"("id")
          );
        `,
      sqlite: `
          CREATE TABLE "User" (
            "id" integer primary key autoincrement,
            "fullName" text not null
          );

          CREATE TABLE "Post" (
            "id" integer primary key autoincrement,
            "userId" integer not null references "User"("id")
          );
        `,
    };

    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
        import { createSeedClient } from '#snaplet/seed'

        const seed = await createSeedClient()

        await seed.users(x => x(3))

        await seed.posts(x => x(3), {
          connect: {
            users: [{
              id: 1,
              fullName: '_'
            }]
          }
        })
      `,
    });

    const posts = await db.query<{ fullName: string }>('select * from "Post"');

    expect(posts).toEqual([
      {
        id: 1,
        userId: 1,
      },
      {
        id: 2,
        userId: 1,
      },
      {
        id: 3,
        userId: 1,
      },
    ]);
  });

  test("connect option requires all ids for composite primary key", async () => {
    const schema: SchemaRecord = {
      default: `
          CREATE TABLE "Member" (
            "teamId" integer not null,
            "personId" integer not null,
            primary key ("teamId", "personId")
          );

          CREATE TABLE "Post" (
            "id" serial primary key,
            "teamId" integer not null,
            "personId" integer not null,
            foreign key ("teamId", "personId")
            references "Member" ("teamId", "personId")
          );
        `,
      sqlite: `
          CREATE TABLE "Member" (
            "teamId" integer not null,
            "personId" integer not null,
            primary key ("teamId", "personId")
          );

          CREATE TABLE "Post" (
            "id" integer primary key autoincrement,
            "teamId" integer not null,
            "personId" integer not null,
            foreign key ("teamId", "personId")
            references "Member" ("teamId", "personId")
          );
        `,
    };

    const { db, runSeedScript } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
    });

    const incompleteIdsPromise = runSeedScript(`
        import { createSeedClient } from '#snaplet/seed'

        const seed = await createSeedClient()

        await seed.members([{
          teamId: 1,
          personId: 1
        }, {
          teamId: 2,
          personId: 2
        }])

        await seed.posts(x => x(3), {
          connect: {
            members: [{
              teamId: 1
            }]
          }
        })
      `);

    await expect(incompleteIdsPromise).rejects.toEqual(
      expect.objectContaining({
        message: expect.stringContaining("is not assignable to type"),
      }),
    );

    const completeIdsPromise = runSeedScript(`
        import { createSeedClient } from '#snaplet/seed'

        const seed = await createSeedClient()

        await seed.members([{
          teamId: 1,
          personId: 1
        }, {
          teamId: 2,
          personId: 2
        }])

        await seed.posts(x => x(3), {
          connect: {
            members: [{
              teamId: 1,
              personId: 1
            }]
          }
        })
      `);

    await expect(completeIdsPromise).resolves.toEqual(expect.anything());

    const posts = await db.query<{ fullName: string }>('select * from "Post"');

    expect(posts).toEqual([
      {
        id: 1,
        teamId: 1,
        personId: 1,
      },
      {
        id: 2,
        teamId: 1,
        personId: 1,
      },
      {
        id: 3,
        teamId: 1,
        personId: 1,
      },
    ]);
  });

  test("connect callback needs only ids for composite primary key", async () => {
    const schema: SchemaRecord = {
      default: `
          CREATE TABLE "Member" (
            "teamId" integer not null,
            "personId" integer not null,
            primary key ("teamId", "personId")
          );

          CREATE TABLE "Post" (
            "id" serial primary key,
            "teamId" integer not null,
            "personId" integer not null,
            foreign key ("teamId", "personId")
            references "Member" ("teamId", "personId")
          );
        `,
      sqlite: `
          CREATE TABLE "Member" (
            "teamId" integer not null,
            "personId" integer not null,
            primary key ("teamId", "personId")
          );

          CREATE TABLE "Post" (
            "id" integer primary key autoincrement,
            "teamId" integer not null,
            "personId" integer not null,
            foreign key ("teamId", "personId")
            references "Member" ("teamId", "personId")
          );
        `,
    };

    const { db, runSeedScript } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
    });

    const incompleteIdsPromise = runSeedScript(
      `
        import { createSeedClient } from '#snaplet/seed'

        const seed = await createSeedClient()

        await seed.members([{
          teamId: 1,
          personId: 1
        }, {
          teamId: 2,
          personId: 2
        }])

        await seed.posts(x => x(3, () => ({
          team: ctx => ctx.connect(({ $store }) => ({
            teamId: $store.members[0].teamId
          }))
        })))
      `,
    );

    await expect(incompleteIdsPromise).rejects.toEqual(
      expect.objectContaining({
        message: expect.stringContaining("is not assignable to type"),
      }),
    );

    const completeIdsPromise = runSeedScript(
      `
        import { createSeedClient } from '#snaplet/seed'

        const seed = await createSeedClient()

        await seed.members([{
          teamId: 1,
          personId: 1
        }, {
          teamId: 2,
          personId: 2
        }])

        await seed.posts(x => x(3, () => ({
          team: ctx => ctx.connect(({ $store }) => ({
            teamId: $store.members[0].teamId,
            personId: $store.members[0].personId
          }))
        })))
      `,
    );

    await expect(completeIdsPromise).resolves.toEqual(expect.anything());

    const posts = await db.query<{ fullName: string }>('select * from "Post"');

    expect(posts).toEqual([
      {
        id: 1,
        teamId: 1,
        personId: 1,
      },
      {
        id: 2,
        teamId: 1,
        personId: 1,
      },
      {
        id: 3,
        teamId: 1,
        personId: 1,
      },
    ]);
  });
}
