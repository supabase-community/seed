import { describe, expect, test } from "vitest";
import { sqlite } from "#test";
import { fetchTablesAndColumns } from "./fetchTablesAndColumns.js";

const adapters = {
  betterSqlite3: () => sqlite.betterSqlite3,
};

describe.each(["betterSqlite3"] as const)(
  "fetchTablesAndColumns: %s",
  (adapter) => {
    const { createTestDb } = adapters[adapter]();

    test("should fetch all tables and columns on empty db", async () => {
      const structure = ``;
      const { client } = await createTestDb(structure);

      const tablesInfos = await fetchTablesAndColumns(client);

      expect(tablesInfos).toEqual([]);
    });

    test("should fetch all tables and columns infos", async () => {
      const structure = `
        CREATE TABLE "Courses" (
          "CourseID" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
          "CourseName" TEXT NOT NULL
        );
        CREATE TABLE "Students" (
            "StudentID" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            "FirstName" TEXT NOT NULL,
            "LastName" TEXT NOT NULL
        );
      `;
      const { client } = await createTestDb(structure);

      const tablesInfos = await fetchTablesAndColumns(client);
      expect(tablesInfos).toEqual([
        {
          columns: [
            {
              affinity: "integer",
              constraints: ["p"],
              default: null,
              id: "Courses.CourseID",
              name: "CourseID",
              nullable: false,
              table: "Courses",
              type: "INTEGER",
            },
            {
              affinity: "text",
              constraints: [],
              default: null,
              id: "Courses.CourseName",
              name: "CourseName",
              nullable: false,
              table: "Courses",
              type: "TEXT",
            },
          ],
          id: "Courses",
          name: "Courses",
          strict: 0,
          type: "table",
          wr: 0,
        },
        {
          columns: [
            {
              affinity: "integer",
              constraints: ["p"],
              default: null,
              id: "Students.StudentID",
              name: "StudentID",
              nullable: false,
              table: "Students",
              type: "INTEGER",
            },
            {
              affinity: "text",
              constraints: [],
              default: null,
              id: "Students.FirstName",
              name: "FirstName",
              nullable: false,
              table: "Students",
              type: "TEXT",
            },
            {
              affinity: "text",
              constraints: [],
              default: null,
              id: "Students.LastName",
              name: "LastName",
              nullable: false,
              table: "Students",
              type: "TEXT",
            },
          ],
          id: "Students",
          name: "Students",
          strict: 0,
          type: "table",
          wr: 0,
        },
      ]);
    });

    test("should also work for tables with composite PK", async () => {
      const structure = `
        CREATE TABLE "Courses" (
          "CourseID" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
          "CourseName" TEXT NOT NULL
        );
        CREATE TABLE "Students" (
            "StudentID" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
            "FirstName" TEXT NOT NULL,
            "LastName" TEXT NOT NULL
        );
        CREATE TABLE "Enrollments" (
            "CourseID" INTEGER NOT NULL,
            "StudentID" INTEGER NOT NULL,
            PRIMARY KEY ("CourseID", "StudentID"),
            FOREIGN KEY ("CourseID") REFERENCES "Courses"("CourseID"),
            FOREIGN KEY ("StudentID") REFERENCES "Students"("StudentID")
        );
        CREATE TABLE "Grades" (
            "CourseID" INTEGER NOT NULL,
            "StudentID" INTEGER NOT NULL,
            "ExamName" TEXT NOT NULL,
            "Grade" REAL NOT NULL,
            PRIMARY KEY ("CourseID", "StudentID", "ExamName"),
            FOREIGN KEY ("CourseID", "StudentID") REFERENCES "Enrollments"("CourseID", "StudentID")
        );
      `;
      const { client } = await createTestDb(structure);

      const tablesInfos = await fetchTablesAndColumns(client);
      expect(tablesInfos).toEqual([
        {
          id: "Courses",
          name: "Courses",
          strict: 0,
          type: "table",
          wr: 0,
          columns: [
            {
              id: "Courses.CourseID",
              name: "CourseID",
              type: "INTEGER",
              table: "Courses",
              nullable: false,
              default: null,
              affinity: "integer",
              constraints: ["p"],
            },
            {
              id: "Courses.CourseName",
              name: "CourseName",
              type: "TEXT",
              table: "Courses",
              nullable: false,
              default: null,
              affinity: "text",
              constraints: [],
            },
          ],
        },
        {
          id: "Enrollments",
          name: "Enrollments",
          strict: 0,
          type: "table",
          wr: 0,
          columns: [
            {
              id: "Enrollments.CourseID",
              name: "CourseID",
              type: "INTEGER",
              table: "Enrollments",
              nullable: false,
              default: null,
              affinity: "integer",
              constraints: ["f", "p"],
            },
            {
              id: "Enrollments.StudentID",
              name: "StudentID",
              type: "INTEGER",
              table: "Enrollments",
              nullable: false,
              default: null,
              affinity: "integer",
              constraints: ["f", "p"],
            },
          ],
        },
        {
          id: "Grades",
          name: "Grades",
          strict: 0,
          type: "table",
          wr: 0,
          columns: [
            {
              id: "Grades.CourseID",
              name: "CourseID",
              type: "INTEGER",
              table: "Grades",
              nullable: false,
              default: null,
              affinity: "integer",
              constraints: ["f", "p"],
            },
            {
              id: "Grades.StudentID",
              name: "StudentID",
              type: "INTEGER",
              table: "Grades",
              nullable: false,
              default: null,
              affinity: "integer",
              constraints: ["f", "p"],
            },
            {
              id: "Grades.ExamName",
              name: "ExamName",
              type: "TEXT",
              table: "Grades",
              nullable: false,
              default: null,
              affinity: "text",
              constraints: ["p"],
            },
            {
              id: "Grades.Grade",
              name: "Grade",
              type: "REAL",
              table: "Grades",
              nullable: false,
              default: null,
              affinity: "real",
              constraints: [],
            },
          ],
        },
        {
          id: "Students",
          name: "Students",
          strict: 0,
          type: "table",
          wr: 0,
          columns: [
            {
              id: "Students.StudentID",
              name: "StudentID",
              type: "INTEGER",
              table: "Students",
              nullable: false,
              default: null,
              affinity: "integer",
              constraints: ["p"],
            },
            {
              id: "Students.FirstName",
              name: "FirstName",
              type: "TEXT",
              table: "Students",
              nullable: false,
              default: null,
              affinity: "text",
              constraints: [],
            },
            {
              id: "Students.LastName",
              name: "LastName",
              type: "TEXT",
              table: "Students",
              nullable: false,
              default: null,
              affinity: "text",
              constraints: [],
            },
          ],
        },
      ]);
    });

    test("should work with tables without explicit primary key", async () => {
      const structure = `
        CREATE TABLE "Courses" (
          "CourseID" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
          "CourseName" TEXT NOT NULL
        );
        CREATE TABLE "Lectures" (
            "LectureName" TEXT NOT NULL,
            "CourseID" INTEGER,
            FOREIGN KEY ("CourseID") REFERENCES "Courses"("CourseID")
        );
      `;
      const { client } = await createTestDb(structure);

      const tablesInfos = await fetchTablesAndColumns(client);

      expect(tablesInfos).toEqual([
        {
          columns: [
            {
              affinity: "integer",
              constraints: ["p"],
              default: null,
              id: "Courses.CourseID",
              name: "CourseID",
              nullable: false,
              table: "Courses",
              type: "INTEGER",
            },
            {
              affinity: "text",
              constraints: [],
              default: null,
              id: "Courses.CourseName",
              name: "CourseName",
              nullable: false,
              table: "Courses",
              type: "TEXT",
            },
          ],
          id: "Courses",
          name: "Courses",
          strict: 0,
          type: "table",
          wr: 0,
        },
        {
          columns: [
            // Note that the rowid column is added automatically
            {
              affinity: "integer",
              constraints: ["p"],
              default: null,
              id: "Lectures.rowid",
              name: "rowid",
              nullable: false,
              table: "Lectures",
              type: "INTEGER",
            },
            {
              affinity: "text",
              constraints: [], // Note that there's no 'p' constraint since there's no primary key
              default: null,
              id: "Lectures.LectureName",
              name: "LectureName",
              nullable: false,
              table: "Lectures",
              type: "TEXT",
            },
            {
              affinity: "integer",
              constraints: ["f"],
              default: null,
              id: "Lectures.CourseID",
              name: "CourseID",
              nullable: true,
              table: "Lectures",
              type: "INTEGER",
            },
          ],
          id: "Lectures",
          name: "Lectures",
          strict: 0,
          type: "table",
          wr: 0,
        },
      ]);
    });
  },
);
