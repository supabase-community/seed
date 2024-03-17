import { describe, expect, test } from "vitest";
import { postgres } from "#test";
import { fetchUniqueConstraints } from "./fetchUniqueConstraints.js";

const adapters = {
  postgres: () => postgres.postgres,
};

describe.each(["postgres"] as const)(
  "fetchUniqueConstraints: %s",
  (adapter) => {
    const { createTestDb } = adapters[adapter]();

    test("should get all unique constraints for tables primary key and unique composite and single", async () => {
      const structure = `
    CREATE TABLE "Courses" (
        "CourseID" SERIAL PRIMARY KEY,
        "CourseName" VARCHAR(255) UNIQUE NOT NULL,
        CHECK ("CourseID" > 0)
    );
    CREATE TABLE "Students" (
        "StudentID" SERIAL PRIMARY KEY,
        "FirstName" VARCHAR(255) NOT NULL,
        "LastName" VARCHAR(255) NOT NULL,
        UNIQUE ("FirstName", "LastName")
    );
    CREATE TABLE "Enrollments" (
        "EnrollmentID" SERIAL PRIMARY KEY,
        "CourseID" INT REFERENCES "Courses"("CourseID"),
        "StudentID" INT REFERENCES "Students"("StudentID"),
        UNIQUE ("CourseID", "StudentID")
    );
    CREATE TABLE "Test" (
        "TestID" SERIAL,
        "Test2ID" SERIAL,
        "Test3" INT,
        UNIQUE ("Test3"),
        PRIMARY KEY ("TestID", "Test2ID")
    );
  `;

      const db = await createTestDb(structure);
      const constraints = await fetchUniqueConstraints(db.client);

      expect(constraints).toEqual([
        {
          tableId: "public.Courses",
          schema: "public",
          table: "Courses",
          dirty: false,
          name: "Courses_CourseName_key",
          columns: ["CourseName"],
        },
        {
          tableId: "public.Courses",
          schema: "public",
          table: "Courses",
          dirty: false,
          name: "Courses_pkey",
          columns: ["CourseID"],
        },
        {
          tableId: "public.Enrollments",
          schema: "public",
          table: "Enrollments",
          dirty: false,
          name: "Enrollments_CourseID_StudentID_key",
          columns: ["CourseID", "StudentID"],
        },
        {
          tableId: "public.Enrollments",
          schema: "public",
          table: "Enrollments",
          dirty: false,
          name: "Enrollments_pkey",
          columns: ["EnrollmentID"],
        },
        {
          tableId: "public.Students",
          schema: "public",
          table: "Students",
          dirty: false,
          name: "Students_FirstName_LastName_key",
          columns: ["FirstName", "LastName"],
        },
        {
          tableId: "public.Students",
          schema: "public",
          table: "Students",
          dirty: false,
          name: "Students_pkey",
          columns: ["StudentID"],
        },
        {
          columns: ["Test3"],
          dirty: false,
          name: "Test_Test3_key",
          schema: "public",
          table: "Test",
          tableId: "public.Test",
        },
        {
          columns: ["Test2ID", "TestID"],
          dirty: false,
          name: "Test_pkey",
          schema: "public",
          table: "Test",
          tableId: "public.Test",
        },
      ]);
    });

    test("should get constraints from different schemas", async () => {
      const structure = `
    CREATE SCHEMA private;
    CREATE TABLE public."Courses" (
        "CourseID" SERIAL PRIMARY KEY
    );
    CREATE TABLE private."Students" (
        "StudentID" SERIAL PRIMARY KEY,
        "FirstName" VARCHAR(255) UNIQUE NOT NULL
    );
  `;
      const db = await createTestDb(structure);
      const constraints = await fetchUniqueConstraints(db.client);
      expect(constraints).toEqual([
        {
          tableId: "private.Students",
          schema: "private",
          table: "Students",
          dirty: false,
          name: expect.any(String),
          columns: ["FirstName"],
        },
        {
          tableId: "private.Students",
          schema: "private",
          table: "Students",
          dirty: false,
          name: expect.any(String),
          columns: ["StudentID"],
        },
        {
          tableId: "public.Courses",
          schema: "public",
          table: "Courses",
          dirty: false,
          name: "Courses_pkey",
          columns: ["CourseID"],
        },
      ]);
    });

    test("should return empty array for tables without constraints", async () => {
      const structure = `
    CREATE TABLE "Courses" (
        "CourseID" INT,
        "CourseName" VARCHAR(255)
    );
    CREATE TABLE "Students" (
        "StudentID" INT,
        "FirstName" VARCHAR(255),
        "LastName" VARCHAR(255)
    );
  `;
      const db = await createTestDb(structure);
      const constraints = await fetchUniqueConstraints(db.client);
      expect(constraints).toEqual([]);
    });
  },
);
