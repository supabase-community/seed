import { describe, expect, test } from "vitest";
import { postgres } from "#test/postgres/postgres/index.js";
import { fetchTablesAndColumns } from "./fetchTablesAndColumns.js";

const adapters = {
  postgres: () => postgres,
};

describe.each(["postgres"] as const)("fetchTablesAndColumns: %s", (adapter) => {
  const { createTestDb } = adapters[adapter]();
  test("should fetch all tables and columns on empty db", async () => {
    const structure = ``;
    const db = await createTestDb(structure);
    const tablesInfos = await fetchTablesAndColumns(db.client);

    expect(tablesInfos).toEqual([]);
  });

  test("should fetch all tables and columns infos", async () => {
    const structure = `
    CREATE TABLE "Courses" (
        "CourseID" SERIAL PRIMARY KEY,
        "CourseName" VARCHAR(255) NOT NULL
    );
    CREATE TABLE "Students" (
        "StudentID" SERIAL PRIMARY KEY,
        "FirstName" VARCHAR(255) NOT NULL,
        "LastName" VARCHAR(255) NOT NULL
    );
  `;
    const db = await createTestDb(structure);
    await db.client.execute(`VACUUM ANALYZE;`);
    const tablesInfos = await fetchTablesAndColumns(db.client);
    expect(tablesInfos).toEqual([
      {
        bytes: 0,
        partitioned: false,
        columns: expect.arrayContaining([
          {
            id: "public.Courses.CourseID",
            constraints: ["p"],
            default: "nextval('\"Courses_CourseID_seq\"'::regclass)",
            generated: "NEVER",
            identity: null,
            maxLength: null,
            name: "CourseID",
            nullable: false,
            schema: "public",
            table: "Courses",
            type: "int4",
            typeId: "pg_catalog.int4",
            typeCategory: "N",
          },
          {
            id: "public.Courses.CourseName",
            constraints: [],
            default: null,
            generated: "NEVER",
            identity: null,
            maxLength: 255,
            name: "CourseName",
            nullable: false,
            schema: "public",
            table: "Courses",
            type: "varchar",
            typeId: "pg_catalog.varchar",
            typeCategory: "S",
          },
        ]),
        id: "public.Courses",
        name: "Courses",
        rows: 0,
        schema: "public",
      },
      {
        bytes: 0,
        partitioned: false,
        columns: expect.arrayContaining([
          {
            id: "public.Students.FirstName",
            constraints: [],
            default: null,
            generated: "NEVER",
            identity: null,
            maxLength: 255,
            name: "FirstName",
            nullable: false,
            schema: "public",
            table: "Students",
            type: "varchar",
            typeId: "pg_catalog.varchar",
            typeCategory: "S",
          },
          {
            id: "public.Students.LastName",
            constraints: [],
            default: null,
            generated: "NEVER",
            identity: null,
            maxLength: 255,
            name: "LastName",
            nullable: false,
            schema: "public",
            table: "Students",
            type: "varchar",
            typeId: "pg_catalog.varchar",
            typeCategory: "S",
          },
          {
            id: "public.Students.StudentID",
            constraints: ["p"],
            default: "nextval('\"Students_StudentID_seq\"'::regclass)",
            generated: "NEVER",
            identity: null,
            maxLength: null,
            name: "StudentID",
            nullable: false,
            schema: "public",
            table: "Students",
            type: "int4",
            typeId: "pg_catalog.int4",
            typeCategory: "N",
          },
        ]),
        id: "public.Students",
        name: "Students",
        rows: 0,
        schema: "public",
      },
    ]);
  });

  test("look up the correct types in the case of several types of the same name in different schemas", async () => {
    const structure = `
    CREATE TYPE public."E" AS ENUM ('A1', 'B1');

    CREATE SCHEMA other;

    CREATE TYPE other."E" AS ENUM ('A2', 'B2');

    CREATE TABLE "Foo" (
        "e1" public."E" NOT NULL
    );
  `;
    const db = await createTestDb(structure);
    await db.client.execute(`VACUUM ANALYZE;`);
    const tablesInfos = await fetchTablesAndColumns(db.client);

    expect(tablesInfos).toEqual([
      {
        bytes: 0,
        partitioned: false,
        columns: [
          {
            id: "public.Foo.e1",
            name: "e1",
            type: "E",
            typeId: "public.E",
            table: "Foo",
            schema: "public",
            nullable: false,
            default: null,
            generated: "NEVER",
            identity: null,
            maxLength: null,
            typeCategory: "E",
            constraints: [],
          },
        ],
        id: "public.Foo",
        name: "Foo",
        rows: 0,
        schema: "public",
      },
    ]);
  });

  test("should also work for tables with composite PK", async () => {
    const structure = `
    CREATE TABLE "Courses" (
        "CourseID" SERIAL PRIMARY KEY,
        "CourseName" VARCHAR(255) NOT NULL
    );
    CREATE TABLE "Students" (
        "StudentID" SERIAL PRIMARY KEY,
        "FirstName" VARCHAR(255) NOT NULL,
        "LastName" VARCHAR(255) NOT NULL
    );
    CREATE TABLE "Enrollments" (
        "CourseID" INT NOT NULL,
        "StudentID" INT NOT NULL,
        PRIMARY KEY ("CourseID", "StudentID"),
        FOREIGN KEY ("CourseID") REFERENCES "Courses"("CourseID"),
        FOREIGN KEY ("StudentID") REFERENCES "Students"("StudentID")
    );
    CREATE TABLE "Grades" (
        "CourseID" INT NOT NULL,
        "StudentID" INT NOT NULL,
        "ExamName" VARCHAR(255) NOT NULL,
        "Grade" FLOAT NOT NULL,
        PRIMARY KEY ("CourseID", "StudentID", "ExamName"),
        FOREIGN KEY ("CourseID", "StudentID") REFERENCES "Enrollments"("CourseID", "StudentID")
    );
  `;
    const db = await createTestDb(structure);
    await db.client.execute(`VACUUM ANALYZE;`);
    const tablesInfos = await fetchTablesAndColumns(db.client);
    expect(tablesInfos).toEqual([
      {
        id: "public.Courses",
        name: "Courses",
        schema: "public",
        partitioned: false,
        rows: 0,
        bytes: 0,
        columns: [
          {
            id: "public.Courses.CourseID",
            name: "CourseID",
            type: "int4",
            typeId: "pg_catalog.int4",
            table: "Courses",
            schema: "public",
            nullable: false,
            default: "nextval('\"Courses_CourseID_seq\"'::regclass)",
            generated: "NEVER",
            maxLength: null,
            identity: null,
            typeCategory: "N",
            constraints: ["p"],
          },
          {
            id: "public.Courses.CourseName",
            name: "CourseName",
            type: "varchar",
            typeId: "pg_catalog.varchar",
            table: "Courses",
            schema: "public",
            nullable: false,
            default: null,
            generated: "NEVER",
            maxLength: 255,
            identity: null,
            typeCategory: "S",
            constraints: [],
          },
        ],
      },
      {
        id: "public.Enrollments",
        name: "Enrollments",
        schema: "public",
        partitioned: false,
        rows: 0,
        bytes: 0,
        columns: [
          {
            id: "public.Enrollments.CourseID",
            name: "CourseID",
            type: "int4",
            typeId: "pg_catalog.int4",
            table: "Enrollments",
            schema: "public",
            nullable: false,
            default: null,
            generated: "NEVER",
            maxLength: null,
            identity: null,
            typeCategory: "N",
            constraints: ["f", "p"],
          },
          {
            id: "public.Enrollments.StudentID",
            name: "StudentID",
            type: "int4",
            typeId: "pg_catalog.int4",
            table: "Enrollments",
            schema: "public",
            nullable: false,
            default: null,
            generated: "NEVER",
            maxLength: null,
            identity: null,
            typeCategory: "N",
            constraints: ["f", "p"],
          },
        ],
      },
      {
        id: "public.Grades",
        name: "Grades",
        schema: "public",
        partitioned: false,
        rows: 0,
        bytes: 0,
        columns: [
          {
            id: "public.Grades.CourseID",
            name: "CourseID",
            type: "int4",
            typeId: "pg_catalog.int4",
            table: "Grades",
            schema: "public",
            nullable: false,
            default: null,
            generated: "NEVER",
            maxLength: null,
            identity: null,
            typeCategory: "N",
            constraints: ["f", "p"],
          },
          {
            id: "public.Grades.StudentID",
            name: "StudentID",
            type: "int4",
            typeId: "pg_catalog.int4",
            table: "Grades",
            schema: "public",
            nullable: false,
            default: null,
            generated: "NEVER",
            maxLength: null,
            identity: null,
            typeCategory: "N",
            constraints: ["f", "p"],
          },
          {
            id: "public.Grades.ExamName",
            name: "ExamName",
            type: "varchar",
            typeId: "pg_catalog.varchar",
            table: "Grades",
            schema: "public",
            nullable: false,
            default: null,
            generated: "NEVER",
            maxLength: 255,
            identity: null,
            typeCategory: "S",
            constraints: ["p"],
          },
          {
            id: "public.Grades.Grade",
            name: "Grade",
            type: "float8",
            typeId: "pg_catalog.float8",
            table: "Grades",
            schema: "public",
            nullable: false,
            default: null,
            generated: "NEVER",
            maxLength: null,
            identity: null,
            typeCategory: "N",
            constraints: [],
          },
        ],
      },
      {
        id: "public.Students",
        name: "Students",
        schema: "public",
        partitioned: false,
        rows: 0,
        bytes: 0,
        columns: [
          {
            id: "public.Students.StudentID",
            name: "StudentID",
            type: "int4",
            typeId: "pg_catalog.int4",
            table: "Students",
            schema: "public",
            nullable: false,
            default: "nextval('\"Students_StudentID_seq\"'::regclass)",
            generated: "NEVER",
            maxLength: null,
            identity: null,
            typeCategory: "N",
            constraints: ["p"],
          },
          {
            id: "public.Students.FirstName",
            name: "FirstName",
            type: "varchar",
            typeId: "pg_catalog.varchar",
            table: "Students",
            schema: "public",
            nullable: false,
            default: null,
            generated: "NEVER",
            maxLength: 255,
            identity: null,
            typeCategory: "S",
            constraints: [],
          },
          {
            id: "public.Students.LastName",
            name: "LastName",
            type: "varchar",
            typeId: "pg_catalog.varchar",
            table: "Students",
            schema: "public",
            nullable: false,
            default: null,
            generated: "NEVER",
            maxLength: 255,
            identity: null,
            typeCategory: "S",
            constraints: [],
          },
        ],
      },
    ]);
  });

  test("should work on multiples schemas with nullables", async () => {
    const structure = `
    CREATE SCHEMA private;
    CREATE TABLE public."Courses" (
        "CourseID" SERIAL PRIMARY KEY,
        "CourseName" VARCHAR(255) NOT NULL
    );
    CREATE TABLE public."Students" (
        "StudentID" SERIAL PRIMARY KEY,
        "FirstName" VARCHAR(255) NOT NULL,
        "LastName" VARCHAR(255) NOT NULL,
        "StudentCourseId" INT,
        FOREIGN KEY ("StudentCourseId") REFERENCES public."Courses"("CourseID")
    );
    CREATE TABLE private."Courses" (
        "CourseID" SERIAL PRIMARY KEY,
        "CourseName" VARCHAR(255) NOT NULL
    );
    CREATE TABLE private."Enrollments" (
        "CourseID" INT,
        "StudentID" INT,
        UNIQUE ("CourseID", "StudentID"),
        FOREIGN KEY ("CourseID") REFERENCES private."Courses"("CourseID"),
        FOREIGN KEY ("StudentID") REFERENCES public."Students"("StudentID")
    );
    CREATE TABLE public."Grades" (
        "CourseID" INT,
        "StudentID" INT,
        "ExamName" VARCHAR(255),
        "Grade" FLOAT NOT NULL,
        PRIMARY KEY ("CourseID", "StudentID", "ExamName"),
        FOREIGN KEY ("CourseID", "StudentID") REFERENCES private."Enrollments"("CourseID", "StudentID")
    );
  `;
    const db = await createTestDb(structure);
    await db.client.execute(`VACUUM ANALYZE;`);
    const tablesInfos = await fetchTablesAndColumns(db.client);

    expect(tablesInfos).toEqual([
      {
        id: "private.Courses",
        name: "Courses",
        schema: "private",
        partitioned: false,
        rows: 0,
        bytes: 0,
        columns: [
          {
            id: "private.Courses.CourseID",
            name: "CourseID",
            type: "int4",
            typeId: "pg_catalog.int4",
            table: "Courses",
            schema: "private",
            nullable: false,
            default: "nextval('private.\"Courses_CourseID_seq\"'::regclass)",
            generated: "NEVER",
            maxLength: null,
            identity: null,
            typeCategory: "N",
            constraints: ["p"],
          },
          {
            id: "private.Courses.CourseName",
            name: "CourseName",
            type: "varchar",
            typeId: "pg_catalog.varchar",
            table: "Courses",
            schema: "private",
            nullable: false,
            default: null,
            generated: "NEVER",
            maxLength: 255,
            identity: null,
            typeCategory: "S",
            constraints: [],
          },
        ],
      },
      {
        id: "public.Courses",
        name: "Courses",
        schema: "public",
        partitioned: false,
        rows: 0,
        bytes: 0,
        columns: [
          {
            id: "public.Courses.CourseID",
            name: "CourseID",
            type: "int4",
            typeId: "pg_catalog.int4",
            table: "Courses",
            schema: "public",
            nullable: false,
            default: "nextval('\"Courses_CourseID_seq\"'::regclass)",
            generated: "NEVER",
            maxLength: null,
            identity: null,
            typeCategory: "N",
            constraints: ["p"],
          },
          {
            id: "public.Courses.CourseName",
            name: "CourseName",
            type: "varchar",
            typeId: "pg_catalog.varchar",
            table: "Courses",
            schema: "public",
            nullable: false,
            default: null,
            generated: "NEVER",
            maxLength: 255,
            identity: null,
            typeCategory: "S",
            constraints: [],
          },
        ],
      },
      {
        id: "private.Enrollments",
        name: "Enrollments",
        schema: "private",
        partitioned: false,
        rows: 0,
        bytes: 0,
        columns: [
          {
            id: "private.Enrollments.CourseID",
            name: "CourseID",
            type: "int4",
            typeId: "pg_catalog.int4",
            table: "Enrollments",
            schema: "private",
            nullable: true,
            default: null,
            generated: "NEVER",
            maxLength: null,
            identity: null,
            typeCategory: "N",
            constraints: ["f", "u"],
          },
          {
            id: "private.Enrollments.StudentID",
            name: "StudentID",
            type: "int4",
            typeId: "pg_catalog.int4",
            table: "Enrollments",
            schema: "private",
            nullable: true,
            default: null,
            generated: "NEVER",
            maxLength: null,
            identity: null,
            typeCategory: "N",
            constraints: ["f", "u"],
          },
        ],
      },
      {
        id: "public.Grades",
        name: "Grades",
        schema: "public",
        partitioned: false,
        rows: 0,
        bytes: 0,
        columns: [
          {
            id: "public.Grades.CourseID",
            name: "CourseID",
            type: "int4",
            typeId: "pg_catalog.int4",
            table: "Grades",
            schema: "public",
            nullable: false,
            default: null,
            generated: "NEVER",
            maxLength: null,
            identity: null,
            typeCategory: "N",
            constraints: ["f", "p"],
          },
          {
            id: "public.Grades.StudentID",
            name: "StudentID",
            type: "int4",
            typeId: "pg_catalog.int4",
            table: "Grades",
            schema: "public",
            nullable: false,
            default: null,
            generated: "NEVER",
            maxLength: null,
            identity: null,
            typeCategory: "N",
            constraints: ["f", "p"],
          },
          {
            id: "public.Grades.ExamName",
            name: "ExamName",
            type: "varchar",
            typeId: "pg_catalog.varchar",
            table: "Grades",
            schema: "public",
            nullable: false,
            default: null,
            generated: "NEVER",
            maxLength: 255,
            identity: null,
            typeCategory: "S",
            constraints: ["p"],
          },
          {
            id: "public.Grades.Grade",
            name: "Grade",
            type: "float8",
            typeId: "pg_catalog.float8",
            table: "Grades",
            schema: "public",
            nullable: false,
            default: null,
            generated: "NEVER",
            maxLength: null,
            identity: null,
            typeCategory: "N",
            constraints: [],
          },
        ],
      },
      {
        id: "public.Students",
        name: "Students",
        schema: "public",
        partitioned: false,
        rows: 0,
        bytes: 0,
        columns: [
          {
            id: "public.Students.StudentID",
            name: "StudentID",
            type: "int4",
            typeId: "pg_catalog.int4",
            table: "Students",
            schema: "public",
            nullable: false,
            default: "nextval('\"Students_StudentID_seq\"'::regclass)",
            generated: "NEVER",
            maxLength: null,
            identity: null,
            typeCategory: "N",
            constraints: ["p"],
          },
          {
            id: "public.Students.FirstName",
            name: "FirstName",
            type: "varchar",
            typeId: "pg_catalog.varchar",
            table: "Students",
            schema: "public",
            nullable: false,
            default: null,
            generated: "NEVER",
            maxLength: 255,
            identity: null,
            typeCategory: "S",
            constraints: [],
          },
          {
            id: "public.Students.LastName",
            name: "LastName",
            type: "varchar",
            typeId: "pg_catalog.varchar",
            table: "Students",
            schema: "public",
            nullable: false,
            default: null,
            generated: "NEVER",
            maxLength: 255,
            identity: null,
            typeCategory: "S",
            constraints: [],
          },
          {
            id: "public.Students.StudentCourseId",
            name: "StudentCourseId",
            type: "int4",
            typeId: "pg_catalog.int4",
            table: "Students",
            schema: "public",
            nullable: true,
            default: null,
            generated: "NEVER",
            maxLength: null,
            identity: null,
            typeCategory: "N",
            constraints: ["f"],
          },
        ],
      },
    ]);
  });
});
