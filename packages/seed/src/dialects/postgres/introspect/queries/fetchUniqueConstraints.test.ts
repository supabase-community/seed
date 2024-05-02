import { describe, expect, test } from "vitest";
import { postgres } from "#test/postgres/postgres/index.js";
import { fetchUniqueConstraints } from "./fetchUniqueConstraints.js";

const adapters = {
  postgres: () => postgres,
};

describe.concurrent.each(["postgres"] as const)(
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
      const constraints = await fetchUniqueConstraints(db.client);

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
      const constraints = await fetchUniqueConstraints(db.client);
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
      const constraints = await fetchUniqueConstraints(db.client);
      expect(constraints).toEqual([]);
    });

    test("should get all the constraints with a mix between primary key, unique, and unique indexes constraints", async () => {
      const structure = `
        CREATE TABLE "channel_thread_message" (
            "id" UUID NOT NULL,
            "user_id" UUID NOT NULL,
            "channel_thread_id" UUID NOT NULL,
            "message" TEXT NOT NULL UNIQUE,
            "unique_nullable" TEXT UNIQUE NULL,
            "unique_nullable_with_index" TEXT,
            "unique_notnull_with_index" TEXT NOT NULL,
            "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        
            CONSTRAINT "channel_thread_message_pkey" PRIMARY KEY ("id")
        );
        CREATE UNIQUE INDEX "channel_thread_message_uniquenullable" ON "channel_thread_message"("unique_nullable_with_index");
        CREATE UNIQUE INDEX "channel_thread_message_uniquenotnullable" ON "channel_thread_message"("unique_notnull_with_index");
        CREATE UNIQUE INDEX "composite_unique" ON "channel_thread_message"("user_id", "channel_thread_id");
        CREATE UNIQUE INDEX "composite_unique_not_nullable" ON "channel_thread_message"("user_id", "channel_thread_id", "unique_notnull_with_index");
      `;

      const db = await createTestDb(structure);
      const constraints = await fetchUniqueConstraints(db.client);

      expect(constraints).toEqual([
        {
          tableId: "public.channel_thread_message",
          schema: "public",
          table: "channel_thread_message",
          dirty: false,
          name: "channel_thread_message_message_key",
          columns: ["message"],
          nullNotDistinct: false,
        },
        {
          tableId: "public.channel_thread_message",
          schema: "public",
          table: "channel_thread_message",
          dirty: false,
          name: "channel_thread_message_pkey",
          columns: ["id"],
          nullNotDistinct: false,
        },
        {
          tableId: "public.channel_thread_message",
          schema: "public",
          table: "channel_thread_message",
          dirty: false,
          name: "channel_thread_message_unique_nullable_key",
          columns: ["unique_nullable"],
          nullNotDistinct: false,
        },
        {
          tableId: "public.channel_thread_message",
          schema: "public",
          table: "channel_thread_message",
          dirty: false,
          name: "channel_thread_message_uniquenotnullable",
          columns: ["unique_notnull_with_index"],
          nullNotDistinct: false,
        },
        {
          tableId: "public.channel_thread_message",
          schema: "public",
          table: "channel_thread_message",
          dirty: false,
          name: "channel_thread_message_uniquenullable",
          columns: ["unique_nullable_with_index"],
          nullNotDistinct: false,
        },
        {
          tableId: "public.channel_thread_message",
          schema: "public",
          table: "channel_thread_message",
          dirty: false,
          name: "composite_unique",
          columns: ["user_id", "channel_thread_id"],
          nullNotDistinct: false,
        },
        {
          tableId: "public.channel_thread_message",
          schema: "public",
          table: "channel_thread_message",
          dirty: false,
          name: "composite_unique_not_nullable",
          columns: [
            "user_id",
            "channel_thread_id",
            "unique_notnull_with_index",
          ],
          nullNotDistinct: false,
        },
      ]);
    });
  },
);
