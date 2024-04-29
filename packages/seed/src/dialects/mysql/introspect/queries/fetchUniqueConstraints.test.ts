import { describe, expect, test } from "vitest";
import { mysql } from "#test/mysql/mysql/index.js";
import { fetchUniqueConstraints } from "./fetchUniqueConstraints.js";

const adapters = {
  mysql: () => mysql,
};

describe.concurrent.each(["mysql"] as const)(
  "fetchUniqueConstraints: %s",
  (adapter) => {
    const { createTestDb } = adapters[adapter]();

    test("should get all unique constraints for tables primary key and unique composite and single", async () => {
      const structure = `
        CREATE TABLE Courses (
            CourseID INT AUTO_INCREMENT PRIMARY KEY,
            CourseName VARCHAR(255) UNIQUE NOT NULL
        );
        CREATE TABLE Students (
            StudentID INT AUTO_INCREMENT PRIMARY KEY,
            FirstName VARCHAR(255) NOT NULL,
            LastName VARCHAR(255) NOT NULL,
            UNIQUE (FirstName, LastName)
        );
        CREATE TABLE Enrollments (
            EnrollmentID INT AUTO_INCREMENT PRIMARY KEY,
            CourseID INT,
            StudentID INT,
            UNIQUE (CourseID, StudentID),
            FOREIGN KEY (CourseID) REFERENCES Courses(CourseID),
            FOREIGN KEY (StudentID) REFERENCES Students(StudentID)
        );
        CREATE TABLE Test (
            TestID INT AUTO_INCREMENT PRIMARY KEY,
            Test2ID INT,
            Test3 INT,
            UNIQUE (Test3),
            UNIQUE (TestID, Test2ID)
        );
      `;

      const db = await createTestDb(structure);
      const constraints = await fetchUniqueConstraints(db.client, [db.name]);

      expect(constraints).toEqual(
        expect.arrayContaining([
          {
            tableId: `${db.name}.Courses`,
            schema: db.name,
            table: "Courses",
            dirty: false,
            name: expect.any(String),
            columns: expect.arrayContaining(["CourseName"]),
          },
          {
            tableId: `${db.name}.Students`,
            schema: db.name,
            table: "Students",
            dirty: false,
            name: expect.any(String),
            columns: expect.arrayContaining(["FirstName", "LastName"]),
          },
          {
            tableId: `${db.name}.Enrollments`,
            schema: db.name,
            table: "Enrollments",
            dirty: false,
            name: expect.any(String),
            columns: expect.arrayContaining(["CourseID", "StudentID"]),
          },
          {
            tableId: `${db.name}.Test`,
            schema: db.name,
            table: "Test",
            dirty: false,
            name: expect.any(String),
            columns: expect.arrayContaining(["Test3"]),
          },
          {
            tableId: `${db.name}.Test`,
            schema: db.name,
            table: "Test",
            dirty: false,
            name: expect.any(String),
            columns: expect.arrayContaining(["TestID", "Test2ID"]),
          },
        ]),
      );
    });

    test("should get constraints from different schemas", async () => {
      // Ensure that we create two separate databases
      const db1 = await createTestDb(`
        CREATE TABLE Courses (
          CourseID INT AUTO_INCREMENT PRIMARY KEY
        );
      `);

      const db2 = await createTestDb(`
        CREATE TABLE Students (
          StudentID INT AUTO_INCREMENT PRIMARY KEY,
          FirstName VARCHAR(255) UNIQUE NOT NULL
        );
      `);

      const constraints = await fetchUniqueConstraints(db1.client, [
        db1.name,
        db2.name,
      ]);

      expect(constraints).toEqual(
        expect.arrayContaining([
          {
            tableId: `${db2.name}.Students`,
            schema: db2.name,
            table: "Students",
            dirty: false,
            name: expect.any(String),
            columns: ["FirstName"],
          },
          {
            tableId: `${db2.name}.Students`,
            schema: db2.name,
            table: "Students",
            dirty: false,
            name: expect.any(String),
            columns: ["StudentID"],
          },
          {
            tableId: `${db1.name}.Courses`,
            schema: db1.name,
            table: "Courses",
            dirty: false,
            name: expect.any(String),
            columns: ["CourseID"],
          },
        ]),
      );
    });

    test("should return empty array for tables without constraints", async () => {
      const structure = `
        CREATE TABLE Courses (
          CourseID INT,
          CourseName VARCHAR(255)
        );
        CREATE TABLE Students (
          StudentID INT,
          FirstName VARCHAR(255),
          LastName VARCHAR(255)
        );
      `;

      const db = await createTestDb(structure);
      const constraints = await fetchUniqueConstraints(db.client, [db.name]);
      expect(constraints).toEqual(expect.arrayContaining([]));
    });
  },
);
