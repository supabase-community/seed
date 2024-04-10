import { test as _test, type TestFunction, expect } from "vitest";
import { adapterEntries } from "#test/adapters.js";
import { setupProject } from "#test/setupProject.js";
import { type DialectRecordWithDefault } from "#test/types.js";

/**
 * Used to have the tests code we use in documentation always in check with the latest behaviour.
 * Avoiding to break the documentation by introducing a different behaviour.
 */

for (const [dialect, adapter] of adapterEntries) {
  const computeName = (name: string) => `e2e > docs > ${dialect} > ${name}`;
  const test = (name: string, fn: TestFunction) => {
    // eslint-disable-next-line vitest/expect-expect, vitest/valid-title
    _test.concurrent(computeName(name), fn);
  };

  const classicalRelationshipsSchema: DialectRecordWithDefault = {
    default: `
        CREATE TABLE "User" (
            "id" SERIAL PRIMARY KEY,
            "name" TEXT NOT NULL
        );

        CREATE TABLE "Post" (
            "id" SERIAL PRIMARY KEY,
            "title" TEXT NOT NULL,
            "content" TEXT NOT NULL,
            "userId" INTEGER NOT NULL,
            CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
        );

        CREATE TABLE "Tag" (
            "id" SERIAL PRIMARY KEY,
            "name" TEXT NOT NULL
        );

        CREATE TABLE "PostTags" (
            "postId" INTEGER NOT NULL,
            "tagId" INTEGER NOT NULL,

            PRIMARY KEY ("postId", "tagId"),
            CONSTRAINT "PostTags_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
            CONSTRAINT "PostTags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE
        );`,
    sqlite: `
        CREATE TABLE "User" (
            "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            "name" TEXT NOT NULL
        );

        CREATE TABLE "Post" (
            "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            "title" TEXT NOT NULL,
            "content" TEXT NOT NULL,
            "userId" INTEGER NOT NULL,
            CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
        );

        CREATE TABLE "Tag" (
            "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
            "name" TEXT NOT NULL
        );

        CREATE TABLE "PostTags" (
            "postId" INTEGER NOT NULL,
            "tagId" INTEGER NOT NULL,

            PRIMARY KEY ("postId", "tagId"),
            CONSTRAINT "PostTags_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
            CONSTRAINT "PostTags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
        );`,
  };

  test("classical relationships examples > one to many", async () => {
    const script = `
      import { createSeedClient } from '#snaplet/seed'
      const seed = await createSeedClient()
      // Clear all tables
      await seed.$resetDatabase();

      // Create 5 users, each potentially having up to 5 posts
      // Posts at this stage do not have associated tags
      await seed.User((x) => x(5, {
          Post: (x) => x({min: 0, max: 5})
      }))
    `;

    const { db, runSeedScript } = await setupProject({
      adapter,
      databaseSchema:
        classicalRelationshipsSchema[dialect] ??
        classicalRelationshipsSchema.default,
      seedConfig: (connectionString) =>
        adapter.generateSeedConfig(connectionString, {
          alias: "{ inflection: false }",
        }),
    });

    await runSeedScript(script);

    const users = await db.query('select * from "User"');
    const posts = await db.query('select * from "Post"');
    const postTags = await db.query('select * from "PostTags"');
    const tags = await db.query('select * from "Tag"');
    expect(users.length).toEqual(5);
    expect(posts.length).toEqual(17);
    expect(postTags.length).toEqual(0);
    expect(tags.length).toEqual(0);
  });

  test("classical relationships examples > many to many", async () => {
    const script = `
      import { createSeedClient } from '#snaplet/seed'
      const seed = await createSeedClient()
      // Clear all tables
      await seed.$resetDatabase();

      // Create 5 users
      await seed.User(
          (x) => x(5, {
          // Each can have up to 5 posts
          Post: (x) => x({min: 0, max: 5},
              () => ({
                  // Each post can be associated with up to 3 tags
                  PostTags: (x) => x({min: 0, max: 3})
              })
          )}
        )
      )
    `;

    const { db, runSeedScript } = await setupProject({
      adapter,
      databaseSchema:
        classicalRelationshipsSchema[dialect] ??
        classicalRelationshipsSchema.default,
      seedConfig: (connectionString) =>
        adapter.generateSeedConfig(connectionString, {
          alias: "{ inflection: false }",
        }),
    });

    await runSeedScript(script);

    const users = await db.query('select * from "User"');
    const posts = await db.query('select * from "Post"');
    const postTags = await db.query('select * from "PostTags"');
    const tags = await db.query('select * from "Tag"');
    expect(users.length).toEqual(5);
    expect(posts.length).toEqual(17);
    expect(postTags.length).toEqual(30);
    expect(tags.length).toEqual(30);
  });

  test("classical relationships examples > many to many with pool", async () => {
    const script = `
      import { createSeedClient } from '#snaplet/seed'
      const seed = await createSeedClient()
      // Clear all tables
      await seed.$resetDatabase();

      // Initially, create a pool of 5 tags for post association
      const { Tag } = await seed.Tag((x) => x(5))

      // Create 5 users
      await seed.User(
        (x) => x(5, {
        // Each can have up to 5 posts
        Post: (x) => x({min: 0, max: 5},
          () => ({
            // Each post can be associated with up to 3 tags
            PostTags: (x) => x({min: 0, max: 3})
          })
        )}),
        {
          // Link the posts to the pre-created tags
          connect: { Tag }
        }
      )
    `;

    const { db, runSeedScript } = await setupProject({
      adapter,
      databaseSchema:
        classicalRelationshipsSchema[dialect] ??
        classicalRelationshipsSchema.default,
      seedConfig: (connectionString) =>
        adapter.generateSeedConfig(connectionString, {
          alias: "{ inflection: false }",
        }),
    });

    await runSeedScript(script);

    const users = await db.query('select * from "User"');
    const posts = await db.query('select * from "Post"');
    const postTags = await db.query('select * from "PostTags"');
    const tags = await db.query('select * from "Tag"');
    expect(users.length).toEqual(5);
    expect(posts.length).toEqual(17);
    expect(postTags.length).toEqual(30);
    expect(tags.length).toEqual(5);
  });
}
