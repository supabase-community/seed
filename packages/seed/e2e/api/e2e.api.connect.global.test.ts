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
  test("connect option globally set in the client apply in all plans", async () => {
    const schema: SchemaRecord = {
      default: `
          CREATE TABLE ${adapter.escapeIdentifier("User")} (
            id serial primary key,
            "fullName" text not null
          );
          CREATE TABLE ${adapter.escapeIdentifier("Post")} (
            id serial primary key,
            "userId" integer not null references ${adapter.escapeIdentifier("User")}(id)
          );
        `,
      sqlite: `
          CREATE TABLE ${adapter.escapeIdentifier("User")} (
            id integer primary key autoincrement,
            "fullName" text not null
          );
          CREATE TABLE ${adapter.escapeIdentifier("Post")} (
            id integer primary key autoincrement,
            "userId" integer not null references ${adapter.escapeIdentifier("User")}(id)
          );
        `,
      mysql: `
          CREATE TABLE ${adapter.escapeIdentifier("User")} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            \`fullName\` VARCHAR(255) NOT NULL
          );
          CREATE TABLE ${adapter.escapeIdentifier("Post")} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            \`userId\` INT NOT NULL,
            FOREIGN KEY (\`userId\`) REFERENCES ${adapter.escapeIdentifier("User")}(id)
          );
        `,
    };

    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
          import { createSeedClient } from '#snaplet/seed'
  
          const seed = await createSeedClient({ connect: true })
  
          await seed.users(x => x(3))
  
          // Should auto-connect to the global store and re-use our users
          await seed.posts(x => x(3))
        `,
    });

    const posts = await db.query<{ userId: number }>(
      `SELECT * FROM ${adapter.escapeIdentifier("Post")}`,
    );
    const users = await db.query<{ id: number }>(
      `SELECT * FROM ${adapter.escapeIdentifier("User")}`,
    );

    expect(posts).toEqual(
      expect.arrayContaining([
        {
          id: 1,
          userId: 3,
        },
        {
          id: 2,
          userId: 1,
        },
        {
          id: 3,
          userId: 2,
        },
      ]),
    );
    expect(users.length).toBe(3);
  });
  test("connect option globally is overriden by plan option", async () => {
    const schema: SchemaRecord = {
      default: `
          CREATE TABLE ${adapter.escapeIdentifier("User")} (
            id serial primary key,
            "fullName" text not null
          );
          CREATE TABLE ${adapter.escapeIdentifier("Post")} (
            id serial primary key,
            "userId" integer not null references ${adapter.escapeIdentifier("User")}(id)
          );
        `,
      sqlite: `
          CREATE TABLE ${adapter.escapeIdentifier("User")} (
            id integer primary key autoincrement,
            "fullName" text not null
          );
          CREATE TABLE ${adapter.escapeIdentifier("Post")} (
            id integer primary key autoincrement,
            "userId" integer not null references ${adapter.escapeIdentifier("User")}(id)
          );
        `,
      mysql: `
          CREATE TABLE ${adapter.escapeIdentifier("User")} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            \`fullName\` VARCHAR(255) NOT NULL
          );
          CREATE TABLE ${adapter.escapeIdentifier("Post")} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            \`userId\` INT NOT NULL,
            FOREIGN KEY (\`userId\`) REFERENCES ${adapter.escapeIdentifier("User")}(id)
          );
        `,
    };

    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
          import { createSeedClient } from '#snaplet/seed'
  
          const seed = await createSeedClient({ connect: true })
  
          await seed.users(x => x(3))
  
          // Should not auto-connect and create new users for each post
          await seed.posts(x => x(3), { connect: {} })
        `,
    });

    const posts = await db.query<{ userId: number }>(
      `SELECT * FROM ${adapter.escapeIdentifier("Post")}`,
    );
    const users = await db.query<{ id: number }>(
      `SELECT * FROM ${adapter.escapeIdentifier("User")}`,
    );

    expect(posts).toEqual(
      expect.arrayContaining([
        {
          id: 1,
          userId: 4,
        },
        {
          id: 2,
          userId: 5,
        },
        {
          id: 3,
          userId: 6,
        },
      ]),
    );
    expect(users.length).toBe(6);
  });
  test("connect option globally is overriden by plan path auto connect", async () => {
    const schema: SchemaRecord = {
      default: `
          CREATE TABLE ${adapter.escapeIdentifier("User")} (
            id serial primary key,
            "fullName" text not null
          );
          CREATE TABLE ${adapter.escapeIdentifier("Post")} (
            id serial primary key,
            "userId" integer not null references ${adapter.escapeIdentifier("User")}(id)
          );
          INSERT INTO ${adapter.escapeIdentifier("User")} ("id", "fullName") VALUES (nextval('"User_id_seq"'::regclass), 'John Doe');
        `,
      sqlite: `
          CREATE TABLE ${adapter.escapeIdentifier("User")} (
            id integer primary key autoincrement,
            "fullName" text not null
          );
          CREATE TABLE ${adapter.escapeIdentifier("Post")} (
            id integer primary key autoincrement,
            "userId" integer not null references ${adapter.escapeIdentifier("User")}(id)
          );
          INSERT INTO ${adapter.escapeIdentifier("User")} ("id", "fullName") VALUES (1, 'John Doe');
        `,
      mysql: `
          CREATE TABLE ${adapter.escapeIdentifier("User")} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            \`fullName\` VARCHAR(255) NOT NULL
          );
          CREATE TABLE ${adapter.escapeIdentifier("Post")} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            \`userId\` INT NOT NULL,
            FOREIGN KEY (\`userId\`) REFERENCES ${adapter.escapeIdentifier("User")}(id)
          );
          INSERT INTO ${adapter.escapeIdentifier("User")} (\`id\`, \`fullName\`) VALUES (1, 'John Doe');
        `,
    };

    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
          import { createSeedClient } from '#snaplet/seed'
  
          // We provide one existing database user to test the auto connect with a pool
          const seed = await createSeedClient({ connect: { users: [{ id: 1 }] } })
  
          // We create 3 more users via seed
          await seed.users(x => x(3))

          // Should create a 5th user and associate it with the posts
          // via the path auto connect
          await seed.users(x => x(1, ({
            posts: [{}, {}, {}]
          })))

          // We create 3 more posts, those should be associated with the 1st use as it's our global default
          await seed.posts(x => x(3))
        `,
    });

    const posts = await db.query<{ userId: number }>(
      `SELECT * FROM ${adapter.escapeIdentifier("Post")}`,
    );
    const users = await db.query<{ id: number }>(
      `SELECT * FROM ${adapter.escapeIdentifier("User")}`,
    );

    expect(posts).toEqual(
      expect.arrayContaining([
        {
          id: 1,
          userId: 5,
        },
        {
          id: 2,
          userId: 5,
        },
        {
          id: 3,
          userId: 5,
        },
        {
          id: 4,
          userId: 1,
        },
        {
          id: 5,
          userId: 1,
        },
        {
          id: 6,
          userId: 1,
        },
      ]),
    );
    expect(users.length).toBe(5);
  });
}
