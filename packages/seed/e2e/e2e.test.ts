import { test as _test, type TestFunction, expect } from "vitest";
import { adapterEntries } from "#test/adapters.js";
import { setupProject } from "#test/setupProject.js";
import { type DialectRecordWithDefault } from "#test/types.js";

for (const [dialect, adapter] of adapterEntries) {
  const computeName = (name: string) => `e2e > ${dialect} > ${name}`;
  const test = (name: string, fn: TestFunction) => {
    // eslint-disable-next-line vitest/expect-expect, vitest/valid-title
    _test.concurrent(computeName(name), fn);
  };

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

    expect((await db.query('select * from "Organization"')).length).toEqual(2);
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

    expect((await db.query('select * from "Organization"')).length).toEqual(0);

    expect((await db.query('select * from "Member"')).length).toEqual(0);

    for (const statement of stdout.split(";").filter(Boolean)) {
      await db.execute(statement);
    }

    expect((await db.query('select * from "Organization"')).length).toEqual(2);

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

    expect((await db.query('select * from "Organization"')).length).toEqual(1);

    expect((await db.query('select * from "Member"')).length).toEqual(5);
  });

  if (dialect !== "sqlite") {
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
  }

  test("option overriding", async () => {
    const { db } = await setupProject({
      adapter,
      databaseSchema: `
        CREATE TABLE "Thing" (
          "id" uuid not null primary key,
          "a" text not null,
          "b" text not null,
          "c" text not null
        );
      `,
      seedScript: `
        import { createSeedClient } from '#seed'

        const seed = await createSeedClient({
          models: {
            things: {
              data: {
                a: 'client-a',
                b: 'client-b',
              }
            }
          },
        })

        await seed.things([{}], {
          models: {
            things: {
              data: {
                b: 'plan-b',
              }
            }
          }
        })
      `,
    });

    expect(await db.query('select * from "Thing"')).toEqual([
      expect.objectContaining({
        a: "client-a",
        b: "plan-b",
      }),
    ]);
  });

  test("connect option", async () => {
    const schema: DialectRecordWithDefault = {
      default: `
            CREATE TABLE student (
              student_id SERIAL PRIMARY KEY,
              first_name VARCHAR(50) NOT NULL,
              last_name VARCHAR(50) NOT NULL,
              email VARCHAR(100) NOT NULL,
              phone_number VARCHAR(15) NOT NULL
            );
            CREATE TABLE tutor (
              tutor_id SERIAL PRIMARY KEY,
              first_name VARCHAR(50) NOT NULL,
              last_name VARCHAR(50) NOT NULL,
              email VARCHAR(100) NOT NULL,
              phone_number VARCHAR(50) NOT NULL
            );
            CREATE TABLE lesson (
              lesson_id SERIAL PRIMARY KEY,
              lesson_type VARCHAR(50) NOT NULL,
              duration_minutes INT NOT NULL,
              price DECIMAL(10, 2) NOT NULL
            );
            CREATE TABLE booking (
              booking_id SERIAL PRIMARY KEY,
              student_id INT NOT NULL REFERENCES student(student_id),
              tutor_id INT NOT NULL REFERENCES tutor(tutor_id),
              lesson_id INT NOT NULL REFERENCES lesson(lesson_id),
              booking_date TIMESTAMP NOT NULL
            );
          `,
      sqlite: `
            CREATE TABLE student (
              student_id INTEGER PRIMARY KEY AUTOINCREMENT,
              first_name TEXT NOT NULL,
              last_name TEXT NOT NULL,
              email TEXT NOT NULL,
              phone_number TEXT NOT NULL
            );
            CREATE TABLE tutor (
              tutor_id INTEGER PRIMARY KEY AUTOINCREMENT,
              first_name TEXT NOT NULL,
              last_name TEXT NOT NULL,
              email TEXT NOT NULL,
              phone_number TEXT NOT NULL
            );
            CREATE TABLE lesson (
              lesson_id INTEGER PRIMARY KEY AUTOINCREMENT,
              lesson_type TEXT NOT NULL,
              duration_minutes INT NOT NULL,
              price DECIMAL(10, 2) NOT NULL
            );
            CREATE TABLE booking (
              booking_id INTEGER PRIMARY KEY AUTOINCREMENT,
              student_id INT NOT NULL REFERENCES student(student_id),
              tutor_id INT NOT NULL REFERENCES tutor(tutor_id),
              lesson_id INT NOT NULL REFERENCES lesson(lesson_id),
              booking_date TIMESTAMP NOT NULL
            );
          `,
    };
    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
        import { createSeedClient } from '#seed'
        const seed = await createSeedClient()
        await seed.tutors([{}, {}])
        await seed.students(c => c(1))
        await seed.bookings(c => c(2), { connect: true })
      `,
    });

    const tutors = await db.query('select * from "tutor"');
    const students = await db.query<{ student_id: string }>(
      'select * from "student"',
    );
    const bookings = await db.query<{ student_id: string }>(
      'select * from "booking"',
    );
    expect(tutors.length).toEqual(2);
    expect(students.length).toEqual(1);
    expect(bookings.length).toEqual(2);
    expect(bookings[0].student_id).toEqual(students[0].student_id);
    expect(bookings[1].student_id).toEqual(students[0].student_id);
  });

  test("default field ordering for `data` in generate callback", async () => {
    const { db } = await setupProject({
      adapter,
      databaseSchema: `
        CREATE TABLE "Organization" (
          "id" serial not null primary key
        );
        CREATE TABLE "Member" (
          "result" text not null,
          "id" serial not null primary key,
          "organizationId" int not null references "Organization"("id"),
          "fromPlanOptions" text not null,
          "fromPlanDescription1" text not null,
          "fromPlanDescription2" text not null,
          "fromClientOptions" text not null,
          "notInPlanDescription" text not null
        );
      `,
      seedScript: `
        import { createSeedClient } from "#seed"

        const seed = await createSeedClient({
          models: {
            members: {
              data: {
                fromClientOptions: () => 'fromClientOptionsValue'
              }
            }
          }
        })

        await seed.members((x) => x(1, {
          fromPlanDescription1: () => 'fromPlanDescription1Value',
          fromPlanDescription2: () => 'fromPlanDescription2Value',
          result: ({ data }) => JSON.stringify(Object.keys(data))
        }), {
          models: {
            members: {
              data: {
                fromPlanOptions: () => 'fromPlanOptionsValue'
              }
            }
          }
        })
      `,
    });

    const [row] = await db.query<{ result: string }>(
      'SELECT result FROM "Member"',
    );

    expect(JSON.parse(row.result)).toEqual([
      "organizationId",
      "id",
      "notInPlanDescription",
      "fromClientOptions",
      "fromPlanOptions",
      "fromPlanDescription1",
      "fromPlanDescription2",
    ]);
  });

  _test.skip(
    // eslint-disable-next-line vitest/valid-title
    computeName("compatibility with externally inserted data"),
    async () => {
      // context(justinvdm, 24 Jan 2024): We use `user_id` as a field name to
      // make sure any field aliasing / renaming we do (e.g. to camel case)
      // does not affect how sequences are found and updated
      const schema: DialectRecordWithDefault = {
        default: `
          CREATE TABLE "User" (
            "user_id" SERIAL PRIMARY KEY
          );
          `,
        sqlite: `
          CREATE TABLE "User" (
            "user_id" INTEGER PRIMARY KEY AUTOINCREMENT
          );
        `,
      };

      const { db, runSeedScript } = await setupProject({
        adapter,
        databaseSchema: schema[dialect] ?? schema.default,
      });

      await db.execute('insert into "User" DEFAULT VALUES');

      await runSeedScript(`
        import { createSeedClient } from "#seed"

        const seed = await createSeedClient()

        // context(justinvdm, 19 Mar 2024): db is not typed as part of codegen-ed
        // types since it is internal, but over here we need a way to execute
        // queries against the same db, and db gives us a straightforward
        // way to do this
        const db = (seed as any).db

        await db.execute('insert into "User" DEFAULT VALUES')
        await db.execute('insert into "User" DEFAULT VALUES')

        await seed.$transaction(async seed => {
          await seed.users(x => x(2))
        })
      `);

      const rows = await db.query('select * from "User"');

      expect(rows).toEqual([
        { user_id: 1 },
        { user_id: 2 },
        { user_id: 3 },
        { user_id: 4 },
        { user_id: 5 },
      ]);
    },
  );

  test("basic path connection", async () => {
    const { db } = await setupProject({
      adapter,
      databaseSchema: `
        create table board (
          id uuid not null primary key,
          name text not null
        );
        create table "column" (
          id uuid not null primary key,
          name text not null,
          board_id uuid not null references board(id)
        );
        create table item (
          id uuid not null primary key,
          name text not null,
          column_id uuid not null references "column"(id),
          board_id uuid not null references board(id)
        );
      `,
      seedScript: `
        import { createSeedClient } from '#seed'

        const seed = await createSeedClient()

        await seed.boards([{
          columns: [{
            items: [{}, {}]
          }]
        }])
      `,
    });

    const boards = await db.query<{ id: string }>("select * from board");
    const columns = await db.query('select * from "column"');
    const items = await db.query("select * from item");

    expect(boards).toHaveLength(1);
    expect(columns).toHaveLength(1);
    expect(items).toEqual([
      expect.objectContaining({ board_id: boards[0].id }),
      expect.objectContaining({ board_id: boards[0].id }),
    ]);
  });

  test("multiple path connections", async () => {
    const { db } = await setupProject({
      adapter,
      databaseSchema: `
              create table board (
                id uuid not null primary key,
                name text not null
              );
              create table "column" (
                id uuid not null primary key,
                name text not null,
                board_id uuid not null references board(id)
              );
              create table item (
                id uuid not null primary key,
                name text not null,
                column_id uuid not null references "column"(id),
                board_id uuid not null references board(id)
              );
            `,
      seedScript: `
              import { createSeedClient } from '#seed'

              const seed = await createSeedClient()

              await seed.boards((x) => x(2, {
                columns: (x) => x(2, {
                  items: (x) => x(2)
                })
              }))
            `,
    });

    const boards = await db.query<{ id: string }>("select * from board");
    const columns = await db.query('select * from "column"');
    const items = await db.query("select * from item");

    expect(boards).toHaveLength(2);
    expect(columns).toHaveLength(4);
    expect(items).toEqual([
      expect.objectContaining({ board_id: boards[0].id }),
      expect.objectContaining({ board_id: boards[0].id }),
      expect.objectContaining({ board_id: boards[0].id }),
      expect.objectContaining({ board_id: boards[0].id }),
      expect.objectContaining({ board_id: boards[1].id }),
      expect.objectContaining({ board_id: boards[1].id }),
      expect.objectContaining({ board_id: boards[1].id }),
      expect.objectContaining({ board_id: boards[1].id }),
    ]);
  });

  test("connect option overrides path connection", async () => {
    const { db } = await setupProject({
      adapter,
      databaseSchema: `
              create table board (
                id uuid not null primary key,
                name text not null
              );
              create table "column" (
                id uuid not null primary key,
                name text not null,
                board_id uuid not null references board(id)
              );
              create table item (
                id uuid not null primary key,
                name text not null,
                column_id uuid not null references "column"(id),
                board_id uuid not null references board(id)
              );
            `,
      seedScript: `
              import { createSeedClient } from '#seed'

              const seed = await createSeedClient()

              const store = await seed.boards([{ name: 'connected board' }])

              await seed.boards([{
                columns: [{
                  items: [{}, {}]
                }]
              }], { connect: store })
            `,
    });

    const boards = await db.query<{ id: string; name: string }>(
      "select * from board",
    );
    const columns = await db.query('select * from "column"');
    const items = await db.query("select * from item");

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const connectedBoard = boards.find((b) => b.name === "connected board")!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const pathBoard = boards.find((b) => b.name !== "connected board")!;

    expect(boards).toHaveLength(2);
    expect(columns).toEqual([
      expect.objectContaining({
        board_id: pathBoard.id,
      }),
    ]);
    expect(items).toEqual([
      expect.objectContaining({ board_id: connectedBoard.id }),
      expect.objectContaining({ board_id: connectedBoard.id }),
    ]);
  });

  test("seeds are unique per seed.<modelName> call", async () => {
    const { db } = await setupProject({
      adapter,
      databaseSchema: `
          create table users (
            id uuid not null primary key,
            confirmation_token text
          );

          create unique index confirmation_token_idx on users (confirmation_token);
        `,
      seedScript: `
      import { createSeedClient } from "#seed"
      const seed = await createSeedClient()
      await seed.$resetDatabase()
      await seed.users([{}])
      await seed.users([{}])
    `,
    });

    const rows = await db.query('select * from "users"');
    expect(rows.length).toEqual(2);
  });

  test("table attributes (name, columns) contain spaces with inflection enabled", async () => {
    const { db } = await setupProject({
      adapter,
      databaseSchema: `
          create table "contracts " (
            id uuid not null primary key,
            "contract type" text not null
          );
          create table "yo lo" (
            id uuid not null primary key
          );
        `,
      seedScript: `
          import { createSeedClient } from "#seed"
          const seed = await createSeedClient()
          await seed.$resetDatabase()
          await seed.contracts([{ contractType: "VIP" }])
          await seed.yoLos([{}])
        `,
    });

    const contracts = await db.query(`select * from "contracts "`);
    const yoLos = await db.query(`select * from "yo lo"`);
    expect(contracts).toEqual([
      expect.objectContaining({ "contract type": "VIP" }),
    ]);
    expect(yoLos.length).toEqual(1);
  });

  // TODO: support spaces when inflection is disabled
  _test.concurrent.skip(
    // eslint-disable-next-line vitest/valid-title
    computeName(
      "table attributes (name, columns) contain spaces with inflection disabled",
    ),
    async () => {
      const { db } = await setupProject({
        adapter,
        seedConfig: (connectionString) =>
          adapter.generateSeedConfig(connectionString, {
            alias: "{ inflection: false }",
          }),
        databaseSchema: `
          create table "contracts " (
            id uuid not null primary key,
            "contract type" text not null
          );
          create table "yo lo" (
            id uuid not null primary key
          );
        `,
        seedScript: `
          import { createSeedClient } from "#seed"
          const seed = await createSeedClient()
          await seed.$resetDatabase()
          await seed["contracts "]([{ "contract type": "VIP" }])
          await seed["yo lo"]([{}])
        `,
      });

      const contracts = await db.query(`select * from "contracts "`);
      const yoLos = await db.query(`select * from "yo lo"`);
      expect(contracts).toEqual([
        expect.objectContaining({ "contract type": "VIP" }),
      ]);
      expect(yoLos.length).toEqual(1);
    },
  );

  test("null field overrides", async () => {
    const { db } = await setupProject({
      adapter,
      databaseSchema: `
        CREATE TABLE "Tmp" (
          "value" text
        );
      `,
      seedScript: `
        import { createSeedClient } from '#seed'

        const seed = await createSeedClient({
          models: {
            tmps: {
              data: {
                value: null,
              }
            }
          }
        })

        await seed.tmps([{}])
      `,
    });

    expect(await db.query('select * from "Tmp"')).toEqual([{ value: null }]);
  });
}
