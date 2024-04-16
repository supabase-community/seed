import { test as _test, type TestFunction, expect } from "vitest";
import { adapterEntries } from "#test/adapters.js";
import { setupProject } from "#test/setupProject.js";
import { type DialectRecordWithDefault } from "#test/types.js";

for (const [dialect, adapter] of adapterEntries) {
  const computeName = (name: string) => `e2e > keys > ${dialect} > ${name}`;
  const test = (name: string, fn: TestFunction) => {
    // eslint-disable-next-line vitest/expect-expect, vitest/valid-title
    _test.concurrent(computeName(name), fn);
  };

  test("generate expected types for common prisma generated SQL accross dialects", async () => {
    const schema: DialectRecordWithDefault = {
      default: `
      -- CreateTable
      CREATE TABLE "User" (
          "id" SERIAL NOT NULL,
          "email" TEXT NOT NULL,
          "name" TEXT NOT NULL,
      
          CONSTRAINT "User_pkey" PRIMARY KEY ("id")
      );
      
      -- CreateTable
      CREATE TABLE "Post" (
          "id" SERIAL NOT NULL,
          "title" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "published" BOOLEAN NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3),
          "userId" INTEGER NOT NULL,
          "bigInt" BIGINT NOT NULL,
          "float" DOUBLE PRECISION NOT NULL,
          "decimal" DECIMAL(65,30) NOT NULL,
          "bytes" BYTEA NOT NULL,
      
          CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
      );
      
      -- CreateIndex
      CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
      
      -- AddForeignKey
      ALTER TABLE "Post" ADD CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        `,
      sqlite: `
      -- CreateTable
      CREATE TABLE "User" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "email" TEXT NOT NULL,
          "name" TEXT NOT NULL
      );
      
      -- CreateTable
      CREATE TABLE "Post" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "title" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "published" BOOLEAN NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME,
          "userId" INTEGER NOT NULL,
          "bigInt" BIGINT NOT NULL,
          "float" REAL NOT NULL,
          "decimal" DECIMAL NOT NULL,
          "bytes" BLOB NOT NULL,
          CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
      );
      
      -- CreateIndex
      CREATE UNIQUE INDEX "User_email_key" ON "User"("email");`,
    };
    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
        import { createSeedClient } from '#snaplet/seed'
          const seed = await createSeedClient({ dryRun: false })
          await seed.users((x) => x(1, {
            posts: (x) => x(1)
          }));
        `,
    });

    const users = await db.query<{ email: string; id: number; name: string }>(
      'SELECT * FROM "User"',
    );
    const posts = await db.query<{
      bigInt: number;
      bytes: Blob;
      content: string;
      createdAt: number;
      decimal: number;
      float: number;
      id: number;
      published: boolean;
      title: string;
      userId: number;
    }>('SELECT * FROM "Post"');
    expect(users).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(Number),
          email: expect.any(String),
          name: expect.any(String),
        }),
      ]),
    );

    expect.extend({
      sqliteBoolean: (received) => {
        const pass = received === 1 || received === 0;
        return {
          pass,
          message: () => (pass ? "" : `expected ${received} to be 0 or 1`),
        };
      },
      dateString: (received) => {
        const date = new Date(received as string);
        const pass = date.toString() !== "Invalid Date";
        return {
          pass,
          message: () =>
            pass
              ? ""
              : `expected ${received} to be a valid date string, got ${date}`,
        };
      },
    });
    expect(posts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(Number),
          title: expect.any(String),
          content: expect.any(String),
          published:
            dialect === "sqlite"
              ? // @ts-expect-error - sqliteBoolean is a custom matcher
                // eslint-disable-next-line @typescript-eslint/no-unsafe-call
                expect.sqliteBoolean()
              : expect.any(Boolean),
          createdAt:
            // By default the createdAt value will be a date string using CURRENT_TIMESTAMP in sqlite
            // @ts-expect-error - dateString is a custom matcher
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            dialect === "sqlite" ? expect.dateString() : expect.any(Date),
          updatedAt:
            // The date that we automatically insert should follow sqlite iso format
            // @ts-expect-error - dateString is a custom matcher
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            dialect === "sqlite" ? expect.dateString() : expect.any(Date),
          userId: expect.any(Number),
          bigInt:
            dialect === "sqlite" ? expect.any(Number) : expect.any(String),
          float: expect.any(Number),
          decimal:
            dialect === "sqlite" ? expect.any(Number) : expect.any(String),
          bytes: expect.any(Buffer),
        }),
      ]),
    );
  });
  test("can override values types for common prisma generated SQL accross dialects", async () => {
    const schema: DialectRecordWithDefault = {
      default: `
      -- CreateTable
      CREATE TABLE "User" (
          "id" SERIAL NOT NULL,
          "email" TEXT NOT NULL,
          "name" TEXT NOT NULL,
      
          CONSTRAINT "User_pkey" PRIMARY KEY ("id")
      );
      
      -- CreateTable
      CREATE TABLE "Post" (
          "id" SERIAL NOT NULL,
          "title" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "published" BOOLEAN NOT NULL,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3),
          "userId" INTEGER NOT NULL,
          "bigInt" BIGINT NOT NULL,
          "float" DOUBLE PRECISION NOT NULL,
          "decimal" DECIMAL(65,30) NOT NULL,
          "bytes" BYTEA NOT NULL,
      
          CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
      );
      
      -- CreateIndex
      CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
      
      -- AddForeignKey
      ALTER TABLE "Post" ADD CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        `,
      sqlite: `
      -- CreateTable
      CREATE TABLE "User" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "email" TEXT NOT NULL,
          "name" TEXT NOT NULL
      );
      
      -- CreateTable
      CREATE TABLE "Post" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "title" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "published" BOOLEAN NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME,
          "userId" INTEGER NOT NULL,
          "bigInt" BIGINT NOT NULL,
          "float" REAL NOT NULL,
          "decimal" DECIMAL NOT NULL,
          "bytes" BLOB NOT NULL,
          CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
      );
      
      -- CreateIndex
      CREATE UNIQUE INDEX "User_email_key" ON "User"("email");`,
    };
    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
        import { createSeedClient } from '#snaplet/seed'
          const seed = await createSeedClient({ dryRun: false })
          await seed.users((x) => x(1, {
            posts: (x) => x(1, {
              bigInt: 1,
              float: 1.1,
              decimal: 1.1,
              bytes: Buffer.from('hello'),
              published: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            })
          }));
        `,
    });

    const users = await db.query<{ email: string; id: number; name: string }>(
      'SELECT * FROM "User"',
    );
    const posts = await db.query<{
      bigInt: number;
      bytes: Blob;
      content: string;
      createdAt: number;
      decimal: number;
      float: number;
      id: number;
      published: boolean;
      title: string;
      userId: number;
    }>('SELECT * FROM "Post"');
    expect(users).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(Number),
          email: expect.any(String),
          name: expect.any(String),
        }),
      ]),
    );

    expect.extend({
      sqliteBoolean: (received) => {
        const pass = received === 1 || received === 0;
        return {
          pass,
          message: () => (pass ? "" : `expected ${received} to be 0 or 1`),
        };
      },
      dateString: (received) => {
        const date = new Date(received as string);
        const pass = date.toString() !== "Invalid Date";
        return {
          pass,
          message: () =>
            pass
              ? ""
              : `expected ${received} to be a valid date string, got ${date}`,
        };
      },
    });
    expect(posts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: expect.any(Number),
          title: expect.any(String),
          content: expect.any(String),
          published:
            // @ts-expect-error - sqliteBoolean is a custom matcher
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            dialect === "sqlite" ? expect.sqliteBoolean() : expect.any(Boolean),
          createdAt:
            // By default the createdAt value will be a date string using CURRENT_TIMESTAMP in sqlite
            // @ts-expect-error - dateString is a custom matcher
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            dialect === "sqlite" ? expect.dateString() : expect.any(Date),
          updatedAt:
            // The date that we automatically insert should follow sqlite iso format
            // @ts-expect-error - dateString is a custom matcher
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            dialect === "sqlite" ? expect.dateString() : expect.any(Date),
          userId: expect.any(Number),
          bigInt:
            dialect === "sqlite" ? expect.any(Number) : expect.any(String),
          float: expect.any(Number),
          decimal:
            dialect === "sqlite" ? expect.any(Number) : expect.any(String),
          bytes: expect.any(Buffer),
        }),
      ]),
    );
  });
  if (dialect === "sqlite") {
    test("can override dates with timestamp number values in sqlite (prisma compatible)", async () => {
      const schema: DialectRecordWithDefault = {
        default: `
      -- CreateTable
      CREATE TABLE "User" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "email" TEXT NOT NULL,
          "name" TEXT NOT NULL
      );
      
      -- CreateTable
      CREATE TABLE "Post" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "title" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "published" BOOLEAN NOT NULL,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME,
          "userId" INTEGER NOT NULL,
          "bigInt" BIGINT NOT NULL,
          "float" REAL NOT NULL,
          "decimal" DECIMAL NOT NULL,
          "bytes" BLOB NOT NULL,
          CONSTRAINT "Post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
      );
      
      -- CreateIndex
      CREATE UNIQUE INDEX "User_email_key" ON "User"("email");`,
      };
      const { db } = await setupProject({
        adapter,
        databaseSchema: schema[dialect] ?? schema.default,
        seedScript: `
        import { createSeedClient } from '#snaplet/seed'
          const seed = await createSeedClient({ dryRun: false })
          await seed.users((x) => x(1, {
            posts: (x) => x(1, {
              // Ensure we can override the date with timestamps
              createdAt: new Date().getTime(),
              updatedAt: new Date().getTime(),
            })
          }));
        `,
      });

      const posts = await db.query<{
        bigInt: number;
        bytes: Blob;
        content: string;
        createdAt: number;
        decimal: number;
        float: number;
        id: number;
        published: boolean;
        title: string;
        userId: number;
      }>('SELECT * FROM "Post"');

      expect(posts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            createdAt: expect.any(Number),
            updatedAt: expect.any(Number),
          }),
        ]),
      );
    });
  }
}
