import { drizzle as drizzleBetterSqlite } from "drizzle-orm/better-sqlite3";
import { describe, expect, test } from "vitest";
import { sqlite } from "#test";
import { createDrizzleORMSqliteClient } from "../../adapters.js";
import { fetchPrimaryKeys } from "./fetchPrimaryKeys.js";

const adapters = {
  betterSqlite3: () => ({
    ...sqlite.betterSqlite3,
    drizzle: drizzleBetterSqlite,
  }),
};

describe.each(["betterSqlite3"] as const)("fetchPrimaryKeys: %s", (adapter) => {
  const { drizzle, createTestDb } = adapters[adapter]();

  test("should get basics primary keys", async () => {
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
    const primaryKeys = await fetchPrimaryKeys(
      createDrizzleORMSqliteClient(drizzle(client)),
    );
    expect(primaryKeys).toEqual(
      expect.arrayContaining([
        {
          keys: [{ name: "CourseID", type: "INTEGER", affinity: "integer" }],
          table: "Courses",
          dirty: false,
          tableId: "Courses",
        },
        {
          keys: [{ name: "StudentID", type: "INTEGER", affinity: "integer" }],
          table: "Students",
          dirty: false,
          tableId: "Students",
        },
      ]),
    );
  });

  test("should get composite primary keys", async () => {
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
    const primaryKeys = await fetchPrimaryKeys(
      createDrizzleORMSqliteClient(drizzle(client)),
    );
    expect(primaryKeys).toEqual([
      {
        keys: [{ name: "CourseID", type: "INTEGER", affinity: "integer" }],
        table: "Courses",
        dirty: false,
        tableId: "Courses",
      },
      {
        keys: [
          { name: "CourseID", type: "INTEGER", affinity: "integer" },
          { name: "StudentID", type: "INTEGER", affinity: "integer" },
        ],
        table: "Enrollments",
        dirty: false,
        tableId: "Enrollments",
      },
      {
        keys: [
          { name: "CourseID", type: "INTEGER", affinity: "integer" },
          { name: "StudentID", type: "INTEGER", affinity: "integer" },
          { name: "ExamName", type: "TEXT", affinity: "text" },
        ],
        table: "Grades",
        dirty: false,
        tableId: "Grades",
      },
      {
        keys: [{ name: "StudentID", type: "INTEGER", affinity: "integer" }],
        table: "Students",
        dirty: false,
        tableId: "Students",
      },
    ]);
  });

  test("should get rowid for a table without PK", async () => {
    const structure = `
        CREATE TABLE "Courses" (
            "CourseName" VARCHAR(255) NOT NULL
        );
      `;
    const { client } = await createTestDb(structure);
    const primaryKeys = await fetchPrimaryKeys(
      createDrizzleORMSqliteClient(drizzle(client)),
    );
    expect(primaryKeys).toEqual(
      expect.arrayContaining([
        {
          keys: [{ name: "rowid", type: "INTEGER", affinity: "integer" }],
          table: "Courses",
          dirty: false,
          tableId: "Courses",
        },
      ]),
    );
  });

  test("should get the PK column for a table WITHOUT ROWID", async () => {
    const structure = `
        CREATE TABLE "Courses" (
            "CourseID" INT4 PRIMARY KEY,
            "CourseName" VARCHAR(255) NOT NULL
        ) WITHOUT ROWID;
      `;
    const { client } = await createTestDb(structure);
    const primaryKeys = await fetchPrimaryKeys(
      createDrizzleORMSqliteClient(drizzle(client)),
    );
    expect(primaryKeys).toEqual(
      expect.arrayContaining([
        {
          keys: [{ name: "CourseID", type: "INT4", affinity: "integer" }],
          table: "Courses",
          dirty: false,
          tableId: "Courses",
        },
      ]),
    );
  });

  test("should get the PK column for a table with TEXT PRIMARY KEY", async () => {
    const structure = `
        CREATE TABLE "Courses" (
            "CourseID" VARCHAR(255) PRIMARY KEY,
            "CourseName" VARCHAR(255) NOT NULL
        ) WITHOUT ROWID;
      `;
    const { client } = await createTestDb(structure);
    const primaryKeys = await fetchPrimaryKeys(
      createDrizzleORMSqliteClient(drizzle(client)),
    );
    expect(primaryKeys).toEqual(
      expect.arrayContaining([
        {
          keys: [{ name: "CourseID", type: "VARCHAR(255)", affinity: "text" }],
          table: "Courses",
          dirty: false,
          tableId: "Courses",
        },
      ]),
    );
  });
});
