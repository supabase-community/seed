import { describe, expect, test } from "vitest";
import { mysql } from "#test/mysql/mysql/index.js";
import { fetchPrimaryKeys } from "./fetchPrimaryKeys.js";

const adapters = {
  mysql: () => mysql,
};

describe.concurrent.each(["mysql"] as const)(
  "fetchPrimaryKeys: %s",
  (adapter) => {
    const { createTestDb } = adapters[adapter]();

    test("should get basics primary keys", async () => {
      const structure = `
        CREATE TABLE Courses (
          CourseID INT AUTO_INCREMENT PRIMARY KEY,
          CourseName VARCHAR(255) NOT NULL
        );
        CREATE TABLE Students (
          StudentID INT AUTO_INCREMENT PRIMARY KEY,
          FirstName VARCHAR(255) NOT NULL,
          LastName VARCHAR(255) NOT NULL
        );
      `;
      const db = await createTestDb(structure);
      const primaryKeys = await fetchPrimaryKeys(db.client, [db.name]);
      expect(primaryKeys).toEqual(
        expect.arrayContaining([
          {
            keys: [{ name: "CourseID", type: "int" }],
            table: "Courses",
            dirty: false,
            schema: db.name,
            tableId: `${db.name}.Courses`,
          },
          {
            keys: [{ name: "StudentID", type: "int" }],
            table: "Students",
            dirty: false,
            schema: db.name,
            tableId: `${db.name}.Students`,
          },
        ]),
      );
    });
    test("should get composite primary keys", async () => {
      const structure = `
        CREATE TABLE Courses (
          CourseID INT AUTO_INCREMENT PRIMARY KEY,
          CourseName VARCHAR(255) NOT NULL
        );
        CREATE TABLE Students (
          StudentID INT AUTO_INCREMENT PRIMARY KEY,
          FirstName VARCHAR(255) NOT NULL,
          LastName VARCHAR(255) NOT NULL
        );
        CREATE TABLE Enrollments (
          CourseID INT NOT NULL,
          StudentID INT NOT NULL,
          PRIMARY KEY (CourseID, StudentID),
          FOREIGN KEY (CourseID) REFERENCES Courses(CourseID),
          FOREIGN KEY (StudentID) REFERENCES Students(StudentID)
        );
        CREATE TABLE Grades (
          CourseID INT NOT NULL,
          StudentID INT NOT NULL,
          ExamName VARCHAR(255) NOT NULL,
          Grade FLOAT NOT NULL,
          PRIMARY KEY (CourseID, StudentID, ExamName),
          FOREIGN KEY (CourseID, StudentID) REFERENCES Enrollments(CourseID, StudentID)
        );
      `;
      const db = await createTestDb(structure);
      const primaryKeys = await fetchPrimaryKeys(db.client, [db.name]);
      expect(primaryKeys).toEqual(
        expect.arrayContaining([
          {
            keys: [{ name: "CourseID", type: "int" }],
            table: "Courses",
            dirty: false,
            schema: db.name,
            tableId: `${db.name}.Courses`,
          },
          {
            keys: [{ name: "StudentID", type: "int" }],
            table: "Students",
            dirty: false,
            schema: db.name,
            tableId: `${db.name}.Students`,
          },
          {
            keys: [
              { name: "CourseID", type: "int" },
              { name: "StudentID", type: "int" },
            ],
            table: "Enrollments",
            dirty: false,
            schema: db.name,
            tableId: `${db.name}.Enrollments`,
          },
          {
            keys: [
              { name: "CourseID", type: "int" },
              { name: "StudentID", type: "int" },
              { name: "ExamName", type: "varchar" },
            ],
            table: "Grades",
            dirty: false,
            schema: db.name,
            tableId: `${db.name}.Grades`,
          },
        ]),
      );
    });

    test("should handle tables without primary keys", async () => {
      const structure = `
        CREATE TABLE Courses (
          CourseName VARCHAR(255) NOT NULL
        );
      `;
      const db = await createTestDb(structure);
      const primaryKeys = await fetchPrimaryKeys(db.client, [db.name]);
      expect(primaryKeys).toEqual(expect.arrayContaining([]));
    });

    test("should handle unique and non-nullable columns", async () => {
      const structure = `
        CREATE TABLE Courses (
          CourseID VARCHAR(50) UNIQUE NOT NULL,
          CourseName VARCHAR(255) NOT NULL
        );
        CREATE TABLE Students (
          StudentID VARCHAR(50) UNIQUE NOT NULL,
          FirstName VARCHAR(255) NOT NULL,
          LastName VARCHAR(255) NOT NULL
        );
      `;
      const db = await createTestDb(structure);
      const primaryKeys = await fetchPrimaryKeys(db.client, [db.name]);
      expect(primaryKeys).toEqual(
        expect.arrayContaining([
          {
            keys: [{ name: "CourseID", type: "varchar" }],
            table: "Courses",
            dirty: false,
            schema: db.name,
            tableId: `${db.name}.Courses`,
          },
          {
            keys: [{ name: "StudentID", type: "varchar" }],
            table: "Students",
            dirty: false,
            schema: db.name,
            tableId: `${db.name}.Students`,
          },
        ]),
      );
    });

    test("should get non nullable columns who have unique index on it as fallback", async () => {
      const structure = `
        CREATE TABLE Courses (
          CourseID VARCHAR(50) NOT NULL,
          CourseName VARCHAR(255) NOT NULL,
          UNIQUE (CourseID)
        );
        CREATE TABLE Students (
          StudentID VARCHAR(50) NOT NULL,
          FirstName VARCHAR(255) NOT NULL,
          LastName VARCHAR(255) NOT NULL,
          UNIQUE (StudentID)
        );
      `;
      const db = await createTestDb(structure);
      const primaryKeys = await fetchPrimaryKeys(db.client, [db.name]);
      expect(primaryKeys).toEqual(
        expect.arrayContaining([
          {
            keys: [{ name: "CourseID", type: "varchar" }],
            table: "Courses",
            dirty: false,
            schema: db.name,
            tableId: `${db.name}.Courses`,
          },
          {
            keys: [{ name: "StudentID", type: "varchar" }],
            table: "Students",
            dirty: false,
            schema: db.name,
            tableId: `${db.name}.Students`,
          },
        ]),
      );
    });

    test("should get composite primary keys on different database", async () => {
      const structure = `
        CREATE TABLE Courses (
          CourseID INT AUTO_INCREMENT PRIMARY KEY,
          CourseName VARCHAR(255) NOT NULL
        );
        CREATE TABLE Students (
          StudentID INT AUTO_INCREMENT PRIMARY KEY,
          FirstName VARCHAR(255) NOT NULL,
          LastName VARCHAR(255) NOT NULL
        );
        CREATE TABLE Enrollments (
          CourseID INT NOT NULL,
          StudentID INT NOT NULL,
          PRIMARY KEY (CourseID, StudentID),
          FOREIGN KEY (CourseID) REFERENCES Courses(CourseID),
          FOREIGN KEY (StudentID) REFERENCES Students(StudentID)
        );
      `;
      const db = await createTestDb(structure);
      const db2 = await createTestDb(`
      CREATE TABLE Grades (
        CourseID INT NOT NULL,
        StudentID INT NOT NULL,
        ExamName VARCHAR(255) NOT NULL,
        Grade FLOAT NOT NULL,
        PRIMARY KEY (CourseID, StudentID, ExamName),
        FOREIGN KEY (CourseID, StudentID) REFERENCES \`${db.name}\`.Enrollments(CourseID, StudentID)
      );`);
      const primaryKeys = await fetchPrimaryKeys(db.client, [
        db.name,
        db2.name,
      ]);
      expect(primaryKeys).toEqual(
        expect.arrayContaining([
          {
            keys: [{ name: "CourseID", type: "int" }],
            table: "Courses",
            dirty: false,
            schema: db.name,
            tableId: `${db.name}.Courses`,
          },
          {
            keys: [{ name: "StudentID", type: "int" }],
            table: "Students",
            dirty: false,
            schema: db.name,
            tableId: `${db.name}.Students`,
          },
          {
            keys: [
              { name: "CourseID", type: "int" },
              { name: "StudentID", type: "int" },
            ],
            table: "Enrollments",
            dirty: false,
            schema: db.name,
            tableId: `${db.name}.Enrollments`,
          },
          {
            keys: [
              { name: "CourseID", type: "int" },
              { name: "StudentID", type: "int" },
              { name: "ExamName", type: "varchar" },
            ],
            table: "Grades",
            dirty: false,
            schema: db2.name,
            tableId: `${db2.name}.Grades`,
          },
        ]),
      );
    });
    test("should work with two tables named the same in two different databases", async () => {
      const db = await createTestDb(
        `
        CREATE TABLE migrations (
            id INT NOT NULL PRIMARY KEY,
            timestamp BIGINT NOT NULL,
            name VARCHAR(255) NOT NULL
        );
      `,
      );

      const db2 = await createTestDb(
        `
        CREATE TABLE migrations (
          version VARCHAR(255) NOT NULL PRIMARY KEY,
          inserted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
      `,
      );

      const primaryKeys = await fetchPrimaryKeys(db.client, [
        db.name,
        db2.name,
      ]);
      expect(primaryKeys).toEqual(
        expect.arrayContaining([
          {
            keys: [
              {
                name: "id",
                type: "int",
              },
            ],
            schema: db.name,
            table: "migrations",
            dirty: false,
            tableId: `${db.name}.migrations`,
          },
          {
            keys: [
              {
                name: "version",
                type: "varchar",
              },
            ],
            schema: db2.name,
            table: "migrations",
            dirty: false,
            tableId: `${db2.name}.migrations`,
          },
        ]),
      );
    });
  },
);
