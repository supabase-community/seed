import { describe, expect, test } from "vitest";
import { mysql } from "#test/mysql/mysql/index.js";
import { fetchSchemas } from "./fetchSchemas.js";
import { fetchTablesAndColumns } from "./fetchTablesAndColumns.js";

const adapters = {
  mysql: () => mysql,
};

describe.concurrent.each(["mysql"] as const)(
  "fetchTablesAndColumns: %s",
  (adapter) => {
    const { createTestDb } = adapters[adapter]();
    test("should fetch all tables and columns on empty db", async () => {
      const structure = ``;
      const db = await createTestDb(structure);
      const tablesInfos = await fetchTablesAndColumns(db.client, [db.name]);

      expect(tablesInfos).toEqual(expect.arrayContaining([]));
    });

    test("should fetch all tables and columns infos", async () => {
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

            columns: expect.arrayContaining([
              {
                id: `${db.name}.Courses.CourseID`,
                name: "CourseID",
                type: "bigint",
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

            columns: expect.arrayContaining([
              {
                id: `${db.name}.Students.StudentID`,
                name: "StudentID",
                type: "bigint",
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
      const publicDb = await createTestDb(`
        CREATE TABLE Courses (
          CourseID SERIAL PRIMARY KEY,
          CourseName VARCHAR(255) NOT NULL
        );
        CREATE TABLE Students (
            StudentID SERIAL PRIMARY KEY,
            FirstName VARCHAR(255) NOT NULL,
            LastName VARCHAR(255) NOT NULL,
            StudentCourseId BIGINT UNSIGNED,
            FOREIGN KEY (StudentCourseId) REFERENCES Courses(CourseID)
        );`);
      const privateDb = await createTestDb(`
        CREATE TABLE Courses (
            CourseID SERIAL PRIMARY KEY,
            CourseName VARCHAR(255) NOT NULL
        );
        CREATE TABLE Enrollments (
            CourseID BIGINT UNSIGNED,
            StudentID BIGINT UNSIGNED,
            UNIQUE (CourseID, StudentID),
            FOREIGN KEY (CourseID) REFERENCES Courses(CourseID),
            FOREIGN KEY (StudentID) REFERENCES \`${publicDb.name}\`.Students(StudentID)
        );`);
      const otherDb = await createTestDb(`
        CREATE TABLE Grades (
            CourseID BIGINT UNSIGNED,
            StudentID BIGINT UNSIGNED,
            ExamName VARCHAR(255),
            Grade FLOAT NOT NULL,
            PRIMARY KEY (CourseID, StudentID, ExamName),
            FOREIGN KEY (CourseID, StudentID) REFERENCES \`${privateDb.name}\`.Enrollments(CourseID, StudentID)
        );`);
      const tablesInfospublicDb = await fetchTablesAndColumns(
        publicDb.client,
        await fetchSchemas(publicDb.client),
      );

      // Formulate the expected output in the MySQL context
      expect(tablesInfospublicDb).toEqual(
        expect.arrayContaining([
          {
            columns: expect.arrayContaining([
              {
                default: null,
                id: `${publicDb.name}.Courses.CourseID`,
                maxLength: null,
                name: "CourseID",
                nullable: false,
                schema: publicDb.name,
                table: "Courses",
                type: "bigint",
              },
              {
                default: null,
                id: `${publicDb.name}.Courses.CourseName`,
                maxLength: 255,
                name: "CourseName",
                nullable: false,
                schema: publicDb.name,
                table: "Courses",
                type: "varchar",
              },
            ]),
            id: `${publicDb.name}.Courses`,
            name: "Courses",
            schema: publicDb.name,
          },
          {
            columns: expect.arrayContaining([
              {
                default: null,
                id: `${publicDb.name}.Students.StudentID`,
                maxLength: null,
                name: "StudentID",
                nullable: false,
                schema: publicDb.name,
                table: "Students",
                type: "bigint",
              },
              {
                default: null,
                id: `${publicDb.name}.Students.FirstName`,
                maxLength: 255,
                name: "FirstName",
                nullable: false,
                schema: publicDb.name,
                table: "Students",
                type: "varchar",
              },
              {
                default: null,
                id: `${publicDb.name}.Students.LastName`,
                maxLength: 255,
                name: "LastName",
                nullable: false,
                schema: publicDb.name,
                table: "Students",
                type: "varchar",
              },
              {
                default: null,
                id: `${publicDb.name}.Students.StudentCourseId`,
                maxLength: null,
                name: "StudentCourseId",
                nullable: true,
                schema: publicDb.name,
                table: "Students",
                type: "bigint",
              },
            ]),
            id: `${publicDb.name}.Students`,
            name: "Students",

            schema: publicDb.name,
          },
          {
            columns: [
              {
                default: null,
                id: `${privateDb.name}.Courses.CourseID`,
                maxLength: null,
                name: "CourseID",
                nullable: false,
                schema: privateDb.name,
                table: "Courses",
                type: "bigint",
              },
              {
                default: null,
                id: `${privateDb.name}.Courses.CourseName`,
                maxLength: 255,
                name: "CourseName",
                nullable: false,
                schema: privateDb.name,
                table: "Courses",
                type: "varchar",
              },
            ],
            id: `${privateDb.name}.Courses`,
            name: "Courses",
            schema: privateDb.name,
          },
          {
            columns: [
              {
                default: null,
                id: `${privateDb.name}.Enrollments.CourseID`,
                maxLength: null,
                name: "CourseID",
                nullable: true,
                schema: privateDb.name,
                table: "Enrollments",
                type: "bigint",
              },
              {
                default: null,
                id: `${privateDb.name}.Enrollments.StudentID`,
                maxLength: null,
                name: "StudentID",
                nullable: true,
                schema: privateDb.name,
                table: "Enrollments",
                type: "bigint",
              },
            ],
            id: `${privateDb.name}.Enrollments`,
            name: "Enrollments",
            schema: privateDb.name,
          },
          {
            columns: [
              {
                default: null,
                id: `${otherDb.name}.Grades.CourseID`,
                maxLength: null,
                name: "CourseID",
                nullable: false,
                schema: otherDb.name,
                table: "Grades",
                type: "bigint",
              },
              {
                default: null,
                id: `${otherDb.name}.Grades.StudentID`,
                maxLength: null,
                name: "StudentID",
                nullable: false,
                schema: otherDb.name,
                table: "Grades",
                type: "bigint",
              },
              {
                default: null,
                id: `${otherDb.name}.Grades.ExamName`,
                maxLength: 255,
                name: "ExamName",
                nullable: false,
                schema: otherDb.name,
                table: "Grades",
                type: "varchar",
              },
              {
                default: null,
                id: `${otherDb.name}.Grades.Grade`,
                maxLength: null,
                name: "Grade",
                nullable: false,
                schema: otherDb.name,
                table: "Grades",
                type: "float",
              },
            ],
            id: `${otherDb.name}.Grades`,
            name: "Grades",
            schema: otherDb.name,
          },
        ]),
      );
    });
    test("should handle tables with ENUM type", async () => {
      const structure = `
        CREATE TABLE Employees (
          EmployeeID INT AUTO_INCREMENT PRIMARY KEY,
          FirstName VARCHAR(255) NOT NULL,
          LastName VARCHAR(255) NOT NULL,
          Status ENUM('ACTIVE', 'INACTIVE', 'RETIRED') NOT NULL DEFAULT 'ACTIVE'
        );
      `;
      const db = await createTestDb(structure);
      const tablesInfos = await fetchTablesAndColumns(db.client, [db.name]);
      expect(tablesInfos).toEqual(
        expect.arrayContaining([
          {
            id: `${db.name}.Employees`,
            name: "Employees",
            schema: db.name,
            columns: expect.arrayContaining([
              {
                id: `${db.name}.Employees.EmployeeID`,
                name: "EmployeeID",
                type: "int",
                schema: db.name,
                table: "Employees",
                nullable: false,
                default: null,
                maxLength: null,
              },
              {
                id: `${db.name}.Employees.FirstName`,
                name: "FirstName",
                type: "varchar",
                schema: db.name,
                table: "Employees",
                nullable: false,
                default: null,
                maxLength: 255,
              },
              {
                id: `${db.name}.Employees.LastName`,
                name: "LastName",
                type: "varchar",
                schema: db.name,
                table: "Employees",
                nullable: false,
                default: null,
                maxLength: 255,
              },
              {
                id: `${db.name}.Employees.Status`,
                name: "Status",
                type: `enum.${db.name}.Employees.Status`,
                schema: db.name,
                table: "Employees",
                nullable: false,
                default: "ACTIVE",
                maxLength: 8,
              },
            ]),
          },
        ]),
      );
    });
  },
);
