import { describe, expect, test } from "vitest";
import { postgres } from "#test/postgres/postgres/index.js";
import { fetchTablesAndColumns } from "./fetchTablesAndColumns.js";

const adapters = {
  postgres: () => postgres,
};

describe.concurrent.each(["postgres"] as const)(
  "fetchTablesAndColumns: %s",
  (adapter) => {
    const { createTestDb } = adapters[adapter]();
    test("should fetch all tables and columns on empty db", async () => {
      const structure = ``;
      const db = await createTestDb(structure);
      const tablesInfos = await fetchTablesAndColumns(db.client, [db.name]);

      expect(tablesInfos).toEqual(expect.arrayContaining([]));
    });

    test.only("should fetch all tables and columns infos", async () => {
      const structure = `
        CREATE TABLE Courses (
            CourseID SERIAL PRIMARY KEY,
            CourseName VARCHAR(255) NOT NULL
        );
        CREATE TABLE Students (
            StudentID SERIAL PRIMARY KEY,
            FirstName VARCHAR(255) NOT NULL,
            LastName VARCHAR(255) NOT NULL
        );
      `;
      const db = await createTestDb(structure);
      const tablesInfos = await fetchTablesAndColumns(db.client, [db.name]);

      expect(tablesInfos).toEqual(
        expect.arrayContaining([
          {
            id: `${db.name}.Courses`,
            name: "Courses",
            schema: db.name,
            rows: null,
            columns: expect.arrayContaining([
              {
                id: `${db.name}.Courses.CourseID`,
                name: "CourseID",
                type: "int",
                schema: db.name,
                table: "Courses",
                nullable: false,
                default: null,
                maxLength: null,
              },
              {
                id: `${db.name}.Courses.CourseName`,
                name: "CourseName",
                type: "varchar",
                schema: db.name,
                table: "Courses",
                nullable: false,
                default: null,
                maxLength: 255,
              },
            ]),
          },
          {
            id: `${db.name}.Students`,
            name: "Students",
            schema: db.name,
            rows: null,
            columns: expect.arrayContaining([
              {
                id: `${db.name}.Students.StudentID`,
                name: "StudentID",
                type: "int",
                schema: db.name,
                table: "Students",
                nullable: false,
                default: null,
                maxLength: null,
              },
              {
                id: `${db.name}.Students.FirstName`,
                name: "FirstName",
                type: "varchar",
                schema: db.name,
                table: "Students",
                nullable: false,
                default: null,
                maxLength: 255,
              },
              {
                id: `${db.name}.Students.LastName`,
                name: "LastName",
                type: "varchar",
                schema: db.name,
                table: "Students",
                nullable: false,
                default: null,
                maxLength: 255,
              },
            ]),
          },
        ]),
      );
    });

    test("look up the correct types in the case of several types of the same name in different schemas", async () => {
      const db1 = await createTestDb(`
        CREATE TABLE Foo (
          e1 ENUM('A1', 'B1') NOT NULL
        );
        `);
      const db2 = await createTestDb(
        `
        CREATE TABLE Foo (
          e1 ENUM('A2', 'B2') NOT NULL
        );
      `,
      );

      const tableInfos = await fetchTablesAndColumns(db1.client, [
        "public",
        "other",
      ]);

      expect(tableInfos).toEqual(
        expect.arrayContaining([
          {
            id: `${db1.name}.Foo`,
            name: "Foo",
            schema: db1.name,
            rows: null, // Depending on how you manage rows and bytes calculation
            columns: [
              {
                id: `${db1.name}.Foo.e1`,
                name: "e1",
                type: "enum('A1', 'B1')",
                schema: db1.name,
                table: "Foo",
                nullable: false,
                default: null,
                maxLength: null,
              },
            ],
          },
          {
            id: `${db2.name}.Foo`,
            name: "Foo",
            schema: db2.name,
            rows: null, // Depending on how you manage rows and bytes calculation
            columns: [
              {
                id: `${db2.name}.Foo.e1`,
                name: "e1",
                type: "enum('A2', 'B2')",
                schema: db2.name,
                table: "Foo",
                nullable: false,
                default: null,
                maxLength: null,
              },
            ],
          },
        ]),
      );
    });

    test("should also work for tables with composite PK", async () => {
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
      const tablesInfos = await fetchTablesAndColumns(db.client, [db.name]);

      expect(tablesInfos).toEqual(
        expect.arrayContaining([
          {
            id: `${db.name}.Courses`,
            name: "Courses",
            schema: db.name,
            rows: null,
            columns: [
              {
                id: `${db.name}.Courses.CourseID`,
                name: "CourseID",
                type: "int",
                schema: db.name,
                table: "Courses",
                nullable: false,
                default: null,
                maxLength: null,
              },
              {
                id: `${db.name}.Courses.CourseName`,
                name: "CourseName",
                type: "varchar",
                schema: db.name,
                table: "Courses",
                nullable: false,
                default: null,
                maxLength: 255,
              },
            ],
          },
          {
            id: `${db.name}.Enrollments`,
            name: "Enrollments",
            schema: db.name,
            rows: null,
            columns: [
              {
                id: `${db.name}.Enrollments.CourseID`,
                name: "CourseID",
                type: "int",
                schema: db.name,
                table: "Enrollments",
                nullable: false,
                default: null,
                maxLength: null,
              },
              {
                id: `${db.name}.Enrollments.StudentID`,
                name: "StudentID",
                type: "int",
                schema: db.name,
                table: "Enrollments",
                nullable: false,
                default: null,
                maxLength: null,
              },
            ],
          },
          {
            id: `${db.name}.Grades`,
            name: "Grades",
            schema: db.name,
            rows: null,
            columns: [
              {
                id: `${db.name}.Grades.CourseID`,
                name: "CourseID",
                type: "int",
                schema: db.name,
                table: "Grades",
                nullable: false,
                default: null,
                maxLength: null,
              },
              {
                id: `${db.name}.Grades.StudentID`,
                name: "StudentID",
                type: "int",
                schema: db.name,
                table: "Grades",
                nullable: false,
                default: null,
                maxLength: null,
              },
              {
                id: `${db.name}.Grades.ExamName`,
                name: "ExamName",
                type: "varchar",
                schema: db.name,
                table: "Grades",
                nullable: false,
                default: null,
                maxLength: 255,
              },
              {
                id: `${db.name}.Grades.Grade`,
                name: "Grade",
                type: "float",
                schema: db.name,
                table: "Grades",
                nullable: false,
                default: null,
                maxLength: null,
              },
            ],
          },
          {
            id: `${db.name}.Students`,
            name: "Students",
            schema: db.name,
            rows: null,
            columns: [
              {
                id: `${db.name}.Students.StudentID`,
                name: "StudentID",
                type: "int",
                schema: db.name,
                table: "Students",
                nullable: false,
                default: null,
                maxLength: null,
              },
              {
                id: `${db.name}.Students.FirstName`,
                name: "FirstName",
                type: "varchar",
                schema: db.name,
                table: "Students",
                nullable: false,
                default: null,
                maxLength: 255,
              },
              {
                id: `${db.name}.Students.LastName`,
                name: "LastName",
                type: "varchar",
                schema: db.name,
                table: "Students",
                nullable: false,
                default: null,
                maxLength: 255,
              },
            ],
          },
        ]),
      );
    });

    test("should work on multiples schemas with nullables", async () => {
      // Setting up multiple databases (MySQL's equivalent of PostgreSQL's schemas)
      const structure = `
        CREATE DATABASE public;
        USE public;
        CREATE TABLE Courses (
            CourseID INT AUTO_INCREMENT PRIMARY KEY,
            CourseName VARCHAR(255) NOT NULL
        );
        CREATE TABLE Students (
            StudentID INT AUTO_INCREMENT PRIMARY KEY,
            FirstName VARCHAR(255) NOT NULL,
            LastName VARCHAR(255) NOT NULL,
            StudentCourseId INT,
            FOREIGN KEY (StudentCourseId) REFERENCES Courses(CourseID)
        );

        CREATE DATABASE private;
        USE private;
        CREATE TABLE Courses (
            CourseID INT AUTO_INCREMENT PRIMARY KEY,
            CourseName VARCHAR(255) NOT NULL
        );
        CREATE TABLE Enrollments (
            CourseID INT,
            StudentID INT,
            UNIQUE (CourseID, StudentID),
            FOREIGN KEY (CourseID) REFERENCES Courses(CourseID),
            FOREIGN KEY (StudentID) REFERENCES public.Students(StudentID)
        );

        USE public;
        CREATE TABLE Grades (
            CourseID INT,
            StudentID INT,
            ExamName VARCHAR(255),
            Grade FLOAT NOT NULL,
            PRIMARY KEY (CourseID, StudentID, ExamName),
            FOREIGN KEY (CourseID, StudentID) REFERENCES private.Enrollments(CourseID, StudentID)
        );
      `;

      const db = await createTestDb(structure);
      const tablesInfosPublic = await fetchTablesAndColumns(db.client, [
        "public",
      ]);
      const tablesInfosPrivate = await fetchTablesAndColumns(db.client, [
        "private",
      ]);

      // Formulate the expected output in the MySQL context
      expect(tablesInfosPublic).toEqual([
        // Add expected table objects here similar to the PostgreSQL test,
        // Adjusting for MySQL types and removing PostgreSQL-specific default values
      ]);

      expect(tablesInfosPrivate).toEqual([
        // Add expected table objects here similar to the PostgreSQL test,
        // Adjusting for MySQL types and removing PostgreSQL-specific default values
      ]);
    });
  },
);
