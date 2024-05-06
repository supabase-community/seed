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

  /**
   * Prisma model used:
   * model user {
   *   id    Int     @id @default(autoincrement())
   *   email String  @unique
   *   name  String
   *
   *   posts post[]
   * }
   *
   * // Define the Post model
   * model post {
   *   id        Int       @id @default(autoincrement())
   *   title     String
   *   content   String
   *   published Boolean
   *   createdAt DateTime  @default(now())
   *   updatedAt DateTime? @updatedAt
   *   userId    Int
   *   bigInt    BigInt
   *   float     Float
   *   decimal   Decimal
   *   bytes     Bytes
   *
   *   user user @relation(fields: [userId], references: [id], onDelete: Restrict, onUpdate: Cascade)
   * }
   *
   */

  test("generate expected types for common prisma generated SQL accross dialects", async () => {
    const schema: DialectRecordWithDefault = {
      default: `
      -- CreateTable
      CREATE TABLE "user" (
          "id" SERIAL NOT NULL,
          "email" TEXT NOT NULL,
          "name" TEXT NOT NULL,
      
          CONSTRAINT "user_pkey" PRIMARY KEY ("id")
      );
      
      -- CreateTable
      CREATE TABLE "post" (
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
      
          CONSTRAINT "post_pkey" PRIMARY KEY ("id")
      );
      
      -- CreateIndex
      CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
      
      -- AddForeignKey
      ALTER TABLE "post" ADD CONSTRAINT "post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        `,
      sqlite: `
      -- CreateTable
      CREATE TABLE "user" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "email" TEXT NOT NULL,
          "name" TEXT NOT NULL
      );
      
      -- CreateTable
      CREATE TABLE "post" (
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
          CONSTRAINT "post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
      );
      
      -- CreateIndex
      CREATE UNIQUE INDEX "user_email_key" ON "user"("email");`,
      mysql: `
        CREATE TABLE \`user\` (
            \`id\` INTEGER NOT NULL AUTO_INCREMENT,
            \`email\` VARCHAR(191) NOT NULL,
            \`name\` VARCHAR(191) NOT NULL,

            UNIQUE INDEX \`user_email_key\`(\`email\`),
            PRIMARY KEY (\`id\`)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

        CREATE TABLE \`post\` (
            \`id\` INTEGER NOT NULL AUTO_INCREMENT,
            \`title\` VARCHAR(191) NOT NULL,
            \`content\` VARCHAR(191) NOT NULL,
            \`published\` BOOLEAN NOT NULL,
            \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
            \`updatedAt\` DATETIME(3) NULL,
            \`userId\` INTEGER NOT NULL,
            \`bigInt\` BIGINT NOT NULL,
            \`float\` DOUBLE NOT NULL,
            \`decimal\` DECIMAL(65, 30) NOT NULL,
            \`bytes\` LONGBLOB NOT NULL,

            PRIMARY KEY (\`id\`)
        ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

        ALTER TABLE \`post\` ADD CONSTRAINT \`post_userId_fkey\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE;
      `,
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
      `SELECT * FROM ${adapter.escapeIdentifier("user")}`,
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
    }>(`SELECT * FROM ${adapter.escapeIdentifier("post")}`);
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
            dialect === "sqlite" || dialect === "mysql"
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
            dialect === "sqlite" || dialect === "mysql"
              ? expect.any(Number)
              : expect.any(String),
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
    CREATE TABLE "user" (
        "id" SERIAL NOT NULL,
        "email" TEXT NOT NULL,
        "name" TEXT NOT NULL,
    
        CONSTRAINT "user_pkey" PRIMARY KEY ("id")
    );
    
    -- CreateTable
    CREATE TABLE "post" (
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
    
        CONSTRAINT "post_pkey" PRIMARY KEY ("id")
    );
    
    -- CreateIndex
    CREATE UNIQUE INDEX "user_email_key" ON "user"("email");
    
    -- AddForeignKey
    ALTER TABLE "post" ADD CONSTRAINT "post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
      `,
      sqlite: `
    -- CreateTable
    CREATE TABLE "user" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "email" TEXT NOT NULL,
        "name" TEXT NOT NULL
    );
    
    -- CreateTable
    CREATE TABLE "post" (
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
        CONSTRAINT "post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
    );
    
    -- CreateIndex
    CREATE UNIQUE INDEX "user_email_key" ON "user"("email");`,
      mysql: `
      CREATE TABLE \`user\` (
          \`id\` INTEGER NOT NULL AUTO_INCREMENT,
          \`email\` VARCHAR(191) NOT NULL,
          \`name\` VARCHAR(191) NOT NULL,

          UNIQUE INDEX \`user_email_key\`(\`email\`),
          PRIMARY KEY (\`id\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

      CREATE TABLE \`post\` (
          \`id\` INTEGER NOT NULL AUTO_INCREMENT,
          \`title\` VARCHAR(191) NOT NULL,
          \`content\` VARCHAR(191) NOT NULL,
          \`published\` BOOLEAN NOT NULL,
          \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
          \`updatedAt\` DATETIME(3) NULL,
          \`userId\` INTEGER NOT NULL,
          \`bigInt\` BIGINT NOT NULL,
          \`float\` DOUBLE NOT NULL,
          \`decimal\` DECIMAL(65, 30) NOT NULL,
          \`bytes\` LONGBLOB NOT NULL,

          PRIMARY KEY (\`id\`)
      ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

      ALTER TABLE \`post\` ADD CONSTRAINT \`post_userId_fkey\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE RESTRICT ON UPDATE CASCADE;
    `,
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
      `SELECT * FROM ${adapter.escapeIdentifier("user")}`,
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
    }>(`SELECT * FROM ${adapter.escapeIdentifier("post")}`);
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
            dialect === "sqlite" || dialect === "mysql"
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
            dialect === "sqlite" || dialect === "mysql"
              ? expect.any(Number)
              : expect.any(String),
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
      CREATE TABLE "user" (
          "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
          "email" TEXT NOT NULL,
          "name" TEXT NOT NULL
      );
      
      -- CreateTable
      CREATE TABLE "post" (
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
          CONSTRAINT "post_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
      );
      
      -- CreateIndex
      CREATE UNIQUE INDEX "user_email_key" ON "user"("email");`,
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
      }>('SELECT * FROM "post"');

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
  if (dialect === "mysql") {
    test("can create valid geometry types in mysql", async () => {
      const structure = `CREATE TABLE \`geometries\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`point\` POINT NOT NULL,
        \`geometry\` GEOMETRY NOT NULL,
        \`linestring\` LINESTRING NOT NULL,
        \`polygon\` POLYGON NOT NULL,
        \`multipoint\` MULTIPOINT NOT NULL,
        \`multilinestring\` MULTILINESTRING NOT NULL,
        \`multipolygon\` MULTIPOLYGON NOT NULL,
        \`geometrycollection\` GEOMETRYCOLLECTION NOT NULL
      );`;

      const { db } = await setupProject({
        adapter,
        databaseSchema: structure,
        seedScript: `
        import { createSeedClient } from '#snaplet/seed'
          const seed = await createSeedClient({ dryRun: false })
          await seed.geometries((x) => x(10));
        `,
      });

      const geometries = await db.query(
        `SELECT * FROM ${adapter.escapeIdentifier("geometries")}`,
      );
      expect(geometries.length).toBe(10);
    });
    test("can override geometry types in mysql", async () => {
      const structure = `CREATE TABLE \`geometries\` (
        \`id\` INT AUTO_INCREMENT PRIMARY KEY,
        \`point\` POINT NOT NULL
      );`;

      const { db } = await setupProject({
        adapter,
        databaseSchema: structure,
        seedScript: `
        import { createSeedClient } from '#snaplet/seed'
          const seed = await createSeedClient({
            dryRun: false,
            models: {
              geometries: {
                data: {
                  point: 'POINT(1 1)',
                }
              }
            }
          })
          await seed.geometries((x) => x(10));
        `,
      });

      const geometries = await db.query<{
        id: number;
        point: { x: number; y: number };
      }>(`SELECT * FROM ${adapter.escapeIdentifier("geometries")}`);
      expect(geometries.length).toBe(10);
      expect(geometries).toEqual([
        { id: 1, point: { x: 1, y: 1 } },
        { id: 2, point: { x: 1, y: 1 } },
        { id: 3, point: { x: 1, y: 1 } },
        { id: 4, point: { x: 1, y: 1 } },
        { id: 5, point: { x: 1, y: 1 } },
        { id: 6, point: { x: 1, y: 1 } },
        { id: 7, point: { x: 1, y: 1 } },
        { id: 8, point: { x: 1, y: 1 } },
        { id: 9, point: { x: 1, y: 1 } },
        { id: 10, point: { x: 1, y: 1 } },
      ]);
    });
  }
}
