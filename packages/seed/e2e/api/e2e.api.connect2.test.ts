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
  test("connect option can take in more than just ids", async () => {
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

    const posts = await db.query<{ userId: number }>(
      `SELECT * FROM ${adapter.escapeIdentifier("Post")}`,
    );

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
          CREATE TABLE ${adapter.escapeIdentifier("Member")} (
            ${adapter.escapeIdentifier("teamId")} integer not null,
            ${adapter.escapeIdentifier("personId")} integer not null,
            primary key (${adapter.escapeIdentifier("teamId")}, ${adapter.escapeIdentifier("personId")})
          );
          CREATE TABLE ${adapter.escapeIdentifier("Post")} (
            id serial primary key,
            ${adapter.escapeIdentifier("teamId")} integer not null,
            ${adapter.escapeIdentifier("personId")} integer not null,
            foreign key (${adapter.escapeIdentifier("teamId")}, ${adapter.escapeIdentifier("personId")}) references ${adapter.escapeIdentifier("Member")}(${adapter.escapeIdentifier("teamId")}, ${adapter.escapeIdentifier("personId")})
          );
        `,
      sqlite: `
          CREATE TABLE ${adapter.escapeIdentifier("Member")} (
            ${adapter.escapeIdentifier("teamId")} integer not null,
            ${adapter.escapeIdentifier("personId")} integer not null,
            primary key (${adapter.escapeIdentifier("teamId")}, ${adapter.escapeIdentifier("personId")})
          );
          CREATE TABLE ${adapter.escapeIdentifier("Post")} (
            id integer primary key autoincrement,
            ${adapter.escapeIdentifier("teamId")} integer not null,
            ${adapter.escapeIdentifier("personId")} integer not null,
            foreign key (${adapter.escapeIdentifier("teamId")}, ${adapter.escapeIdentifier("personId")}) references ${adapter.escapeIdentifier("Member")}(${adapter.escapeIdentifier("teamId")}, ${adapter.escapeIdentifier("personId")})
          );
        `,
      mysql: `
          CREATE TABLE ${adapter.escapeIdentifier("Member")} (
            ${adapter.escapeIdentifier("teamId")} INT NOT NULL,
            ${adapter.escapeIdentifier("personId")} INT NOT NULL,
            PRIMARY KEY (${adapter.escapeIdentifier("teamId")}, ${adapter.escapeIdentifier("personId")})
          );
          CREATE TABLE ${adapter.escapeIdentifier("Post")} (
            id INT AUTO_INCREMENT PRIMARY KEY,
            ${adapter.escapeIdentifier("teamId")} INT NOT NULL,
            ${adapter.escapeIdentifier("personId")} INT NOT NULL,
            FOREIGN KEY (${adapter.escapeIdentifier("teamId")}, ${adapter.escapeIdentifier("personId")}) REFERENCES ${adapter.escapeIdentifier("Member")}(${adapter.escapeIdentifier("teamId")}, personId)
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
  
        const seed = await createSeedClient(); 
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

    const posts = await db.query<{ personId: number; teamId: number }>(
      `SELECT * FROM ${adapter.escapeIdentifier("Post")}`,
    );

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
