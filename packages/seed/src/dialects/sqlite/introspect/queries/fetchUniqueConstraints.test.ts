import { describe, expect, test } from "vitest";
import { sqlite } from "#test";
import { fetchUniqueConstraints } from "./fetchUniqueConstraints.js";

const adapters = {
  betterSqlite3: () => sqlite.betterSqlite3,
};

describe.each(["betterSqlite3"] as const)(
  "fetchUniqueConstraints: %s",
  (adapter) => {
    const { createTestDb } = adapters[adapter]();
    test("should get all unique constraints for tables primary key and unique composite and single", async () => {
      const structure = `
    CREATE TABLE "Courses" (
      "CourseID" INTEGER PRIMARY KEY AUTOINCREMENT,
      "CourseName" TEXT UNIQUE NOT NULL,
      CHECK ("CourseID" > 0)
    );
    CREATE TABLE "Students" (
        "StudentID" INTEGER PRIMARY KEY AUTOINCREMENT,
        "FirstName" TEXT NOT NULL,
        "LastName" TEXT NOT NULL,
        UNIQUE ("FirstName", "LastName")
    );
    CREATE TABLE "Enrollments" (
        "EnrollmentID" INTEGER PRIMARY KEY AUTOINCREMENT,
        "CourseID" INTEGER,
        "StudentID" INTEGER,
        FOREIGN KEY ("CourseID") REFERENCES "Courses"("CourseID"),
        FOREIGN KEY ("StudentID") REFERENCES "Students"("StudentID"),
        UNIQUE ("CourseID", "StudentID")
    );
    CREATE TABLE "Test" (
        "TestID" INTEGER,
        "Test2ID" INTEGER,
        "Test3" INTEGER UNIQUE,
        PRIMARY KEY ("TestID", "Test2ID")
    );
  `;

      const db = await createTestDb(structure);
      const constraints = await fetchUniqueConstraints(db.client);

      expect(constraints).toEqual([
        {
          tableId: "Courses",
          table: "Courses",
          dirty: false,
          name: "Courses_CourseName_key",
          columns: ["CourseName"],
        },
        {
          tableId: "Enrollments",
          table: "Enrollments",
          dirty: false,
          name: "Enrollments_CourseID_StudentID_key",
          columns: ["CourseID", "StudentID"],
        },
        {
          tableId: "Students",
          table: "Students",
          dirty: false,
          name: "Students_FirstName_LastName_key",
          columns: ["FirstName", "LastName"],
        },
        {
          columns: ["Test3"],
          dirty: false,
          name: "Test_Test3_key",
          tableId: "Test",
          table: "Test",
        },
        {
          columns: ["TestID", "Test2ID"],
          dirty: false,
          name: "Test_pkey",
          tableId: "Test",
          table: "Test",
        },
        {
          tableId: "Courses",
          table: "Courses",
          dirty: false,
          name: "Courses_pkey",
          columns: ["CourseID"],
        },
        {
          tableId: "Enrollments",
          table: "Enrollments",
          dirty: false,
          name: "Enrollments_pkey",
          columns: ["EnrollmentID"],
        },
        {
          tableId: "Students",
          table: "Students",
          dirty: false,
          name: "Students_pkey",
          columns: ["StudentID"],
        },
      ]);
    });

    test("should work without rowid tables", async () => {
      const structure = `
   CREATE TABLE "TestWithoutRowId" (
       "TestID" INTEGER PRIMARY KEY
   ) WITHOUT ROWID;
   CREATE TABLE "TestCompositeWithoutRowId" (
       "TestID" INTEGER,
       "Test2ID" INTEGER,
       PRIMARY KEY ("TestID", "Test2ID")
   ) WITHOUT ROWID;
`;

      const db = await createTestDb(structure);
      const constraints = await fetchUniqueConstraints(db.client);
      expect(constraints).toEqual([
        {
          columns: ["TestID", "Test2ID"],
          dirty: false,
          name: "TestCompositeWithoutRowId_pkey",
          tableId: "TestCompositeWithoutRowId",
          table: "TestCompositeWithoutRowId",
        },
        {
          tableId: "TestWithoutRowId",
          table: "TestWithoutRowId",
          dirty: false,
          name: "TestWithoutRowId_pkey",
          columns: ["TestID"],
        },
      ]);
    });

    test("should return empty array if no unique constraints", async () => {
      const structure = `
    CREATE TABLE "Courses" (
        "CourseID" INT,
        "CourseName" VARCHAR(255)
    );
    CREATE TABLE "Students" (
        "StudentID" INT,
        "FirstName" VARCHAR(255),
        "LastName" VARCHAR(255)
    );`;

      const db = await createTestDb(structure);
      const constraints = await fetchUniqueConstraints(db.client);

      expect(constraints).toEqual([]);
    });
  },
);
