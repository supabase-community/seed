import { drizzle as drizzleBetterSqlite } from "drizzle-orm/better-sqlite3";
import { describe, expect, test } from "vitest";
import { sqlite } from "#test";
import { createDrizzleORMSqliteClient } from "../../adapters.js";
import { fetchDatabaseRelationships } from "./fetchDatabaseRelationships.js";

const adapters = {
  betterSqlite3: () => ({
    ...sqlite.betterSqlite3,
    drizzle: drizzleBetterSqlite,
  }),
};

describe.each(["betterSqlite3"] as const)(
  "fetchDatabaseRelationships: %s",
  (adapter) => {
    const { drizzle, createTestDb } = adapters[adapter]();
    test("should return empty array if no relations", async () => {
      const structure = `
        CREATE TABLE "Courses" (
          "CourseID" INTEGER PRIMARY KEY AUTOINCREMENT,
          "CourseName" TEXT NOT NULL
        );
        CREATE TABLE "Students" (
            "StudentID" INTEGER PRIMARY KEY AUTOINCREMENT,
            "FirstName" TEXT NOT NULL,
            "LastName" TEXT NOT NULL
        );
      `;
      const { client } = await createTestDb(structure);
      const relationships = await fetchDatabaseRelationships(
        createDrizzleORMSqliteClient(drizzle(client)),
      );
      expect(relationships.length).toEqual(0);
    });

    test("should get composite FK and basic FK", async () => {
      const structure = `
        CREATE TABLE "Courses" (
          "CourseID" INTEGER PRIMARY KEY AUTOINCREMENT,
          "CourseName" TEXT NOT NULL
        );
        CREATE TABLE "Students" (
            "StudentID" INTEGER PRIMARY KEY AUTOINCREMENT,
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
      const relationships = await fetchDatabaseRelationships(
        createDrizzleORMSqliteClient(drizzle(client)),
      );
      expect(relationships).toEqual(
        expect.arrayContaining([
          {
            fkTable: "Enrollments",
            id: "Enrollments_CourseID_fkey",

            keys: [
              {
                fkColumn: "CourseID",
                fkType: "INTEGER",
                fkAffinity: "integer",
                nullable: false,
                targetColumn: "CourseID",
                targetType: "INTEGER",
                targetAffinity: "integer",
              },
            ],
            targetTable: "Courses",
          },
          {
            fkTable: "Enrollments",
            id: "Enrollments_StudentID_fkey",

            keys: [
              {
                fkColumn: "StudentID",
                fkType: "INTEGER",
                fkAffinity: "integer",
                nullable: false,
                targetColumn: "StudentID",
                targetType: "INTEGER",
                targetAffinity: "integer",
              },
            ],
            targetTable: "Students",
          },
          {
            fkTable: "Grades",
            id: "Grades_CourseID_StudentID_fkey",

            keys: [
              {
                fkColumn: "CourseID",
                fkType: "INTEGER",
                fkAffinity: "integer",
                nullable: false,
                targetColumn: "CourseID",
                targetType: "INTEGER",
                targetAffinity: "integer",
              },
              {
                fkColumn: "StudentID",
                fkType: "INTEGER",
                fkAffinity: "integer",
                nullable: false,
                targetColumn: "StudentID",
                targetType: "INTEGER",
                targetAffinity: "integer",
              },
            ],
            targetTable: "Enrollments",
          },
        ]),
      );
    });
  },
);
