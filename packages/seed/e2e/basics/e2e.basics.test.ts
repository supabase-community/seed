import { test as _test, type TestFunction, expect } from "vitest";
import { type DialectId } from "#dialects/dialects.js";
import { adapterEntries } from "#test/adapters.js";
import { setupProject } from "#test/setupProject.js";

type DialectRecordWithDefault<T> = Partial<Record<DialectId, T>> &
  Record<"default", T>;
type SchemaRecord = DialectRecordWithDefault<string>;

for (const [dialect, adapter] of adapterEntries) {
  const computeName = (name: string) => `e2e > ${dialect} > ${name}`;
  const test = (name: string, fn: TestFunction) => {
    // eslint-disable-next-line vitest/expect-expect, vitest/valid-title
    _test.concurrent(computeName(name), fn);
  };

  if (dialect !== "sqlite") {
    test("generates for char limits", async () => {
      const schema: SchemaRecord = {
        default: `
          CREATE TABLE testtable (
            id uuid not null,
            fullname varchar(5) not null
          );
        `,
        mysql: `
          CREATE TABLE testtable (
            id VARCHAR(36) PRIMARY KEY DEFAULT (uuid()),
            fullname varchar(5) not null
          );
        `,
      };
      const { db } = await setupProject({
        adapter,
        databaseSchema: schema[dialect] ?? schema.default,
        seedScript: `
          import { createSeedClient } from '#snaplet/seed'
          const seed = await createSeedClient()
          await seed.testtables([{}])
        `,
      });

      const [{ fullname }] = await db.query<{ fullname: string }>(
        "select * from testtable",
      );
      expect(fullname.length).toBeLessThanOrEqual(5);
    });
  }

  test("option overriding", async () => {
    const schema: SchemaRecord = {
      default: `
        CREATE TABLE Thing (
          "id" uuid not null primary key,
          "a" text not null,
          "b" text not null,
          "c" text not null
        );
      `,
      mysql: `
        CREATE TABLE Thing (
          id VARCHAR(36) PRIMARY KEY DEFAULT (uuid()),
          a text not null,
          b text not null,
          c text not null
        );
      `,
    };
    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
        import { createSeedClient } from '#snaplet/seed'

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

    expect(await db.query("select * from Thing")).toEqual([
      expect.objectContaining({
        a: "client-a",
        b: "plan-b",
      }),
    ]);
  });

  test("connect option", async () => {
    const schema: SchemaRecord = {
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
      mysql: `
            CREATE TABLE student (
              student_id INT AUTO_INCREMENT PRIMARY KEY,
              first_name VARCHAR(255) NOT NULL,
              last_name VARCHAR(255) NOT NULL,
              email VARCHAR(255) NOT NULL,
              phone_number VARCHAR(255) NOT NULL
            );
            
            CREATE TABLE tutor (
              tutor_id INT AUTO_INCREMENT PRIMARY KEY,
              first_name VARCHAR(255) NOT NULL,
              last_name VARCHAR(255) NOT NULL,
              email VARCHAR(255) NOT NULL,
              phone_number VARCHAR(255) NOT NULL
            );
            
            CREATE TABLE lesson (
              lesson_id INT AUTO_INCREMENT PRIMARY KEY,
              lesson_type VARCHAR(255) NOT NULL,
              duration_minutes INT NOT NULL,
              price DECIMAL(10, 2) NOT NULL
            );
            
            CREATE TABLE booking (
              booking_id INT AUTO_INCREMENT PRIMARY KEY,
              student_id INT NOT NULL,
              tutor_id INT NOT NULL,
              lesson_id INT NOT NULL,
              booking_date DATETIME NOT NULL,
              FOREIGN KEY (student_id) REFERENCES student(student_id),
              FOREIGN KEY (tutor_id) REFERENCES tutor(tutor_id),
              FOREIGN KEY (lesson_id) REFERENCES lesson(lesson_id)
            );
          `,
    };
    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
        import { createSeedClient } from '#snaplet/seed'
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
        import { createSeedClient } from "#snaplet/seed"

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
      const schema: SchemaRecord = {
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
        import { createSeedClient } from "#snaplet/seed"

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
}
