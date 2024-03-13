import { describe, expect, test } from "vitest";
import { type Dialect, adapters } from "#test/adapters.js";
import { setupProject } from "#test/setupProject.js";

for (const dialect of Object.keys(adapters) as Array<Dialect>) {
  const adapter = await adapters[dialect]();

  if (adapter.skipReason) {
    describe.skip(`e2e: ${dialect} (${adapter.skipReason})`, () => {
      null;
    });

    continue;
  }

  describe(
    `e2e: ${dialect}`,
    () => {
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

        expect((await db.query('select * from "Organization"')).length).toEqual(
          2,
        );
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

        expect((await db.query('select * from "Organization"')).length).toEqual(
          0,
        );

        expect((await db.query('select * from "Member"')).length).toEqual(0);

        for (const statement of stdout.split(";").filter(Boolean)) {
          await db.run(statement);
        }

        expect((await db.query('select * from "Organization"')).length).toEqual(
          2,
        );

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

        expect((await db.query('select * from "Organization"')).length).toEqual(
          1,
        );

        expect((await db.query('select * from "Member"')).length).toEqual(5);
      });

      dialect !== "sqlite" &&
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
        const schema: Partial<Record<"default" | Dialect, string>> = {
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
          databaseSchema: schema[dialect] ?? schema["default"],
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
    },
    {
      timeout: 45000,
    },
  );
}
