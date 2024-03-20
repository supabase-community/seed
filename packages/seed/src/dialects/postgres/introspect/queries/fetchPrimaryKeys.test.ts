import { describe, expect, test } from "vitest";
import { postgres } from "#test/postgres/postgres/index.js";
import { fetchPrimaryKeys } from "./fetchPrimaryKeys.js";

const adapters = {
  postgres: () => postgres,
};

describe.each(["postgres"] as const)("fetchPrimaryKeys: %s", (adapter) => {
  const { createTestDb } = adapters[adapter]();
  test("should get basics primary keys", async () => {
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
    const primaryKeys = await fetchPrimaryKeys(db.client);
    expect(primaryKeys).toEqual(
      expect.arrayContaining([
        {
          keys: [{ name: "CourseID", type: "int4" }],
          schema: "public",
          table: "Courses",
          dirty: false,
          tableId: "public.Courses",
        },
        {
          keys: [{ name: "StudentID", type: "int4" }],
          schema: "public",
          table: "Students",
          dirty: false,
          tableId: "public.Students",
        },
      ]),
    );
  });

  test("should get composite primary keys", async () => {
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
    const primaryKeys = await fetchPrimaryKeys(db.client);
    expect(primaryKeys).toEqual([
      {
        keys: [{ name: "CourseID", type: "int4" }],
        schema: "public",
        table: "Courses",
        dirty: false,
        tableId: "public.Courses",
      },
      {
        keys: [
          { name: "CourseID", type: "int4" },
          { name: "StudentID", type: "int4" },
        ],
        schema: "public",
        table: "Enrollments",
        dirty: false,
        tableId: "public.Enrollments",
      },
      {
        keys: [
          { name: "CourseID", type: "int4" },
          { name: "ExamName", type: "varchar" },
          { name: "StudentID", type: "int4" },
        ],
        schema: "public",
        table: "Grades",
        dirty: false,
        tableId: "public.Grades",
      },
      {
        keys: [{ name: "StudentID", type: "int4" }],
        schema: "public",
        table: "Students",
        dirty: false,
        tableId: "public.Students",
      },
    ]);
  });

  test("should get composite primary keys on different schemas", async () => {
    const structure = `
    CREATE SCHEMA private;
    CREATE TABLE public."Courses" (
        "CourseID" SERIAL PRIMARY KEY,
        "CourseName" VARCHAR(255) NOT NULL
    );
    CREATE TABLE private."Students" (
        "StudentID" SERIAL PRIMARY KEY,
        "FirstName" VARCHAR(255) NOT NULL,
        "LastName" VARCHAR(255) NOT NULL
    );
  `;
    const db = await createTestDb(structure);
    const primaryKeys = await fetchPrimaryKeys(db.client);
    expect(primaryKeys).toEqual(
      expect.arrayContaining([
        {
          keys: [{ name: "StudentID", type: "int4" }],
          schema: "private",
          table: "Students",
          dirty: false,
          tableId: "private.Students",
        },
        {
          keys: [{ name: "CourseID", type: "int4" }],
          schema: "public",
          table: "Courses",
          dirty: false,
          tableId: "public.Courses",
        },
      ]),
    );
  });

  test("should empty array for a table without any PK", async () => {
    const structure = `
    CREATE TABLE public."Courses" (
        "CourseName" VARCHAR(255) NOT NULL
    );
  `;
    const db = await createTestDb(structure);
    const primaryKeys = await fetchPrimaryKeys(db.client);
    expect(primaryKeys).toEqual(expect.arrayContaining([]));
  });

  test("should get non nullable unique columns as fallback", async () => {
    const structure = `
    CREATE TABLE "Courses" (
        "CourseID" TEXT UNIQUE NOT NULL,
        "CourseName" VARCHAR(255) NOT NULL
    );
    CREATE TABLE "Students" (
        "StudentID" TEXT UNIQUE NOT NULL,
        "FirstName" VARCHAR(255) NOT NULL,
        "LastName" VARCHAR(255) NOT NULL
    );
  `;
    const db = await createTestDb(structure);
    const primaryKeys = await fetchPrimaryKeys(db.client);
    expect(primaryKeys).toEqual(
      expect.arrayContaining([
        {
          keys: [{ name: "CourseID", type: "text" }],
          schema: "public",
          table: "Courses",
          dirty: false,
          tableId: "public.Courses",
        },
        {
          keys: [{ name: "StudentID", type: "text" }],
          schema: "public",
          table: "Students",
          dirty: false,
          tableId: "public.Students",
        },
      ]),
    );
  });

  test("should get non nullable columns who have unique index on it as fallback", async () => {
    const structure = `
    CREATE TABLE "Courses" (
        "CourseID" TEXT NOT NULL,
        "CourseName" VARCHAR(255) NOT NULL
    );
    CREATE TABLE "Students" (
        "StudentID" TEXT NOT NULL,
        "FirstName" VARCHAR(255) NOT NULL,
        "LastName" VARCHAR(255) NOT NULL
    );
    CREATE UNIQUE INDEX idx_courses_value ON "Courses"("CourseID");
    CREATE UNIQUE INDEX idx_student_value ON "Students"("StudentID");
  `;
    const db = await createTestDb(structure);
    const primaryKeys = await fetchPrimaryKeys(db.client);
    expect(primaryKeys).toEqual(
      expect.arrayContaining([
        {
          keys: [{ name: "CourseID", type: "text" }],
          schema: "public",
          table: "Courses",
          dirty: false,
          tableId: "public.Courses",
        },
        {
          keys: [{ name: "StudentID", type: "text" }],
          schema: "public",
          table: "Students",
          dirty: false,
          tableId: "public.Students",
        },
      ]),
    );
  });

  test("should only fetch primary keys if there is some", async () => {
    const structure = `
    CREATE TABLE "Courses" (
        "ID" SERIAL PRIMARY KEY,
        "CourseID" TEXT NOT NULL,
        "CourseName" VARCHAR(255) NOT NULL
    );
    CREATE TABLE "Students" (
        "StudentID" TEXT NOT NULL,
        "FirstName" VARCHAR(255) NOT NULL,
        "LastName" VARCHAR(255) NOT NULL
    );
    CREATE UNIQUE INDEX idx_courses_value ON "Courses"("CourseID");
    CREATE UNIQUE INDEX idx_student_value ON "Students"("StudentID");
  `;
    const db = await createTestDb(structure);
    const primaryKeys = await fetchPrimaryKeys(db.client);
    expect(primaryKeys).toEqual(
      expect.arrayContaining([
        {
          keys: [{ name: "ID", type: "int4" }],
          schema: "public",
          table: "Courses",
          dirty: false,
          tableId: "public.Courses",
        },
        {
          keys: [{ name: "StudentID", type: "text" }],
          schema: "public",
          table: "Students",
          dirty: false,
          tableId: "public.Students",
        },
      ]),
    );
  });

  test("should get non nullable columns who have unique index as composite keys on it as fallback", async () => {
    const structure = `
    CREATE TABLE "Courses" (
        "CourseID" TEXT NOT NULL,
        "RoomID" TEXT NOT NULL,
        "CourseName" VARCHAR(255) NOT NULL
    );
    CREATE TABLE "Students" (
        "StudentID" TEXT NOT NULL,
        "FirstName" VARCHAR(255) NOT NULL,
        "LastName" VARCHAR(255) NOT NULL
    );
    CREATE UNIQUE INDEX idx_courses_value ON "Courses"("CourseID", "RoomID");
    CREATE UNIQUE INDEX idx_student_value ON "Students"("StudentID");
  `;
    const db = await createTestDb(structure);
    const primaryKeys = await fetchPrimaryKeys(db.client);
    expect(primaryKeys).toEqual(
      expect.arrayContaining([
        {
          keys: [
            { name: "CourseID", type: "text" },
            { name: "RoomID", type: "text" },
          ],
          schema: "public",
          table: "Courses",
          dirty: false,
          tableId: "public.Courses",
        },
        {
          keys: [{ name: "StudentID", type: "text" }],
          schema: "public",
          table: "Students",
          dirty: false,
          tableId: "public.Students",
        },
      ]),
    );
  });

  test("should work with mix between tables", async () => {
    const structure = `
    CREATE TABLE "compositeNotNullIndex" (
        "CourseID" TEXT NOT NULL,
        "RoomID" TEXT NOT NULL,
        "CourseName" VARCHAR(255) NOT NULL
    );
    CREATE TABLE "notNullIndex" (
        "StudentID" TEXT NOT NULL,
        "FirstName" VARCHAR(255) NOT NULL,
        "LastName" VARCHAR(255) NOT NULL
    );
    CREATE TABLE "primaryKey" (
      "pk" SERIAL PRIMARY KEY
    );
    CREATE TABLE "compositePrimaryKey" (
        "CourseID" INT NOT NULL,
        "StudentID" INT NOT NULL,
        PRIMARY KEY ("CourseID", "StudentID")
    );
    CREATE TABLE "uniqueNonNullableColumn" (
        "CourseID" INT UNIQUE NOT NULL
    );
    CREATE TABLE "compositeUniqueNonNullableColumn" (
        "CourseID" INT UNIQUE NOT NULL,
        "OtherID" INT UNIQUE NOT NULL
    );
    CREATE UNIQUE INDEX idx_compositeNotNullIndex_value ON "compositeNotNullIndex"("CourseID", "RoomID");
    CREATE UNIQUE INDEX idx_student_value ON "notNullIndex"("StudentID");
  `;
    const db = await createTestDb(structure);
    const primaryKeys = await fetchPrimaryKeys(db.client);
    expect(primaryKeys).toEqual(
      expect.arrayContaining([
        {
          keys: [
            {
              name: "CourseID",
              type: "text",
            },
            {
              name: "RoomID",
              type: "text",
            },
          ],
          schema: "public",
          table: "compositeNotNullIndex",
          dirty: false,
          tableId: "public.compositeNotNullIndex",
        },
        {
          keys: [
            {
              name: "CourseID",
              type: "int4",
            },
            {
              name: "StudentID",
              type: "int4",
            },
          ],
          schema: "public",
          table: "compositePrimaryKey",
          dirty: false,
          tableId: "public.compositePrimaryKey",
        },
        {
          keys: [
            {
              name: "CourseID",
              type: "int4",
            },
            {
              name: "OtherID",
              type: "int4",
            },
          ],
          schema: "public",
          table: "compositeUniqueNonNullableColumn",
          dirty: false,
          tableId: "public.compositeUniqueNonNullableColumn",
        },
        {
          keys: [
            {
              name: "StudentID",
              type: "text",
            },
          ],
          schema: "public",
          table: "notNullIndex",
          dirty: false,
          tableId: "public.notNullIndex",
        },
        {
          keys: [
            {
              name: "pk",
              type: "int4",
            },
          ],
          schema: "public",
          table: "primaryKey",
          dirty: false,
          tableId: "public.primaryKey",
        },
        {
          keys: [
            {
              name: "CourseID",
              type: "int4",
            },
          ],
          schema: "public",
          table: "uniqueNonNullableColumn",
          dirty: false,
          tableId: "public.uniqueNonNullableColumn",
        },
      ]),
    );
  });

  test("should work with two tables named the same in two different schemas", async () => {
    const structure = `
  CREATE SCHEMA IF NOT EXISTS supabase_functions;
  CREATE TABLE public.migrations (
      id integer NOT NULL PRIMARY KEY,
      "timestamp" bigint NOT NULL,
      name character varying NOT NULL
  );
  CREATE TABLE supabase_functions.migrations (
    version text NOT NULL PRIMARY KEY,
    inserted_at timestamp with time zone DEFAULT now() NOT NULL
  );
  `;
    const db = await createTestDb(structure);
    const primaryKeys = await fetchPrimaryKeys(db.client);
    expect(primaryKeys).toEqual(
      expect.arrayContaining([
        {
          keys: [
            {
              name: "id",
              type: "int4",
            },
          ],
          schema: "public",
          table: "migrations",
          dirty: false,
          tableId: "public.migrations",
        },
        {
          keys: [
            {
              name: "version",
              type: "text",
            },
          ],
          schema: "supabase_functions",
          table: "migrations",
          dirty: false,
          tableId: "supabase_functions.migrations",
        },
      ]),
    );
  });
});
