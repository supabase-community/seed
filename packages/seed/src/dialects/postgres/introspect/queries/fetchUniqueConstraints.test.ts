import { drizzle as drizzleJs } from "drizzle-orm/postgres-js";
import { describe, expect, test } from "vitest";
import { postgres } from "#test";
import { createDrizzleORMPgClient } from "../../adapters.js";
import { fetchUniqueConstraints } from "./fetchUniqueConstraints.js";

const adapters = {
  postgresJs: () => ({
    ...postgres.postgresJs,
    drizzle: drizzleJs,
  }),
};

describe.each(["postgresJs"] as const)(
  "fetchUniqueConstraints: %s",
  (adapter) => {
    const { drizzle, createTestDb } = adapters[adapter]();

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
      const constraints = await fetchUniqueConstraints(
        createDrizzleORMPgClient(drizzle(db.client)),
      );

      expect(constraints).toEqual([
        {
          tableId: "public.Courses",
          schema: "public",
          table: "Courses",
          dirty: false,
          name: "Courses_CourseName_key",
          columns: ["CourseName"],
          nullNotDistinct: false,
        },
        {
          tableId: "public.Courses",
          schema: "public",
          table: "Courses",
          dirty: false,
          name: "Courses_pkey",
          columns: ["CourseID"],
          nullNotDistinct: false,
        },
        {
          tableId: "public.Enrollments",
          schema: "public",
          table: "Enrollments",
          dirty: false,
          name: "Enrollments_CourseID_StudentID_key",
          columns: ["CourseID", "StudentID"],
          nullNotDistinct: false,
        },
        {
          tableId: "public.Enrollments",
          schema: "public",
          table: "Enrollments",
          dirty: false,
          name: "Enrollments_pkey",
          columns: ["EnrollmentID"],
          nullNotDistinct: false,
        },
        {
          tableId: "public.Students",
          schema: "public",
          table: "Students",
          dirty: false,
          name: "Students_FirstName_LastName_key",
          columns: ["FirstName", "LastName"],
          nullNotDistinct: false,
        },
        {
          tableId: "public.Students",
          schema: "public",
          table: "Students",
          dirty: false,
          name: "Students_pkey",
          columns: ["StudentID"],
          nullNotDistinct: false,
        },
        {
          columns: ["Test3"],
          nullNotDistinct: false,
          dirty: false,
          name: "Test_Test3_key",
          schema: "public",
          table: "Test",
          tableId: "public.Test",
        },
        {
          columns: ["Test2ID", "TestID"],
          nullNotDistinct: false,
          dirty: false,
          name: "Test_pkey",
          schema: "public",
          table: "Test",
          tableId: "public.Test",
        },
      ]);
    });

    // This test require your local dev to be postgres 15 or higher if you want to run it try
    // docker run -it -p 5432:5432 -e POSTGRES_HOST_AUTH_METHOD=trust postgres:15
    test("should get the right value for the constraints with NOT NULLS DISTINCT parameter on it", async () => {
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
        UNIQUE NULLS NOT DISTINCT ("CourseID", "StudentID")
    );
    CREATE TABLE "Test" (
        "TestID" SERIAL,
        "Test2ID" SERIAL,
        "Test3" INT,
        UNIQUE NULLS NOT DISTINCT ("Test3"),
        PRIMARY KEY ("TestID", "Test2ID")
    );
  `;

      const db = await createTestDb(structure);
      const constraints = await fetchUniqueConstraints(
        createDrizzleORMPgClient(drizzle(db.client)),
      );

      expect(constraints).toEqual([
        {
          tableId: "public.Courses",
          schema: "public",
          table: "Courses",
          dirty: false,
          name: "Courses_CourseName_key",
          columns: ["CourseName"],
          nullNotDistinct: false,
        },
        {
          tableId: "public.Courses",
          schema: "public",
          table: "Courses",
          dirty: false,
          name: "Courses_pkey",
          columns: ["CourseID"],
          nullNotDistinct: false,
        },
        {
          tableId: "public.Enrollments",
          schema: "public",
          table: "Enrollments",
          dirty: false,
          name: "Enrollments_CourseID_StudentID_key",
          columns: ["CourseID", "StudentID"],
          nullNotDistinct: true,
        },
        {
          tableId: "public.Enrollments",
          schema: "public",
          table: "Enrollments",
          dirty: false,
          name: "Enrollments_pkey",
          columns: ["EnrollmentID"],
          nullNotDistinct: false,
        },
        {
          tableId: "public.Students",
          schema: "public",
          table: "Students",
          dirty: false,
          name: "Students_FirstName_LastName_key",
          columns: ["FirstName", "LastName"],
          nullNotDistinct: false,
        },
        {
          tableId: "public.Students",
          schema: "public",
          table: "Students",
          dirty: false,
          name: "Students_pkey",
          columns: ["StudentID"],
          nullNotDistinct: false,
        },
        {
          columns: ["Test3"],
          nullNotDistinct: true,
          dirty: false,
          name: "Test_Test3_key",
          schema: "public",
          table: "Test",
          tableId: "public.Test",
        },
        {
          columns: ["Test2ID", "TestID"],
          nullNotDistinct: false,
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
      const constraints = await fetchUniqueConstraints(
        createDrizzleORMPgClient(drizzle(db.client)),
      );
      expect(constraints).toEqual([
        {
          tableId: "private.Students",
          schema: "private",
          table: "Students",
          dirty: false,
          name: expect.any(String),
          columns: ["FirstName"],
          nullNotDistinct: false,
        },
        {
          tableId: "private.Students",
          schema: "private",
          table: "Students",
          dirty: false,
          name: expect.any(String),
          columns: ["StudentID"],
          nullNotDistinct: false,
        },
        {
          tableId: "public.Courses",
          schema: "public",
          table: "Courses",
          dirty: false,
          name: "Courses_pkey",
          columns: ["CourseID"],
          nullNotDistinct: false,
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
      const constraints = await fetchUniqueConstraints(
        createDrizzleORMPgClient(drizzle(db.client)),
      );
      expect(constraints).toEqual([]);
    });
  },
);
