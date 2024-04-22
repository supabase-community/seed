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
}
