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

      expect(tablesInfos).toEqual([]);
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
                constraints: expect.arrayContaining(["p", "u"]),
                name: "CourseID",
                type: "bigint",
                schema: db.name,
                table: "Courses",
                nullable: false,
                default: null,
                generated: false,
                maxLength: null,
              },
              {
                id: `${db.name}.Courses.CourseName`,
                constraints: [],
                name: "CourseName",
                type: "varchar",
                schema: db.name,
                table: "Courses",
                nullable: false,
                default: null,
                generated: false,
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
                constraints: expect.arrayContaining(["p", "u"]),
                name: "StudentID",
                type: "bigint",
                schema: db.name,
                table: "Students",
                nullable: false,
                default: null,
                generated: false,
                maxLength: null,
              },
              {
                id: `${db.name}.Students.FirstName`,
                name: "FirstName",
                type: "varchar",
                constraints: [],
                schema: db.name,
                table: "Students",
                nullable: false,
                default: null,
                generated: false,
                maxLength: 255,
              },
              {
                id: `${db.name}.Students.LastName`,
                name: "LastName",
                constraints: [],
                type: "varchar",
                schema: db.name,
                table: "Students",
                nullable: false,
                default: null,
                generated: false,
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

            columns: expect.arrayContaining([
              {
                id: `${db.name}.Courses.CourseID`,
                constraints: expect.arrayContaining(["p"]),
                name: "CourseID",
                type: "int",
                schema: db.name,
                table: "Courses",
                nullable: false,
                default: null,
                generated: false,
                maxLength: null,
              },
              {
                id: `${db.name}.Courses.CourseName`,
                constraints: [],
                name: "CourseName",
                type: "varchar",
                schema: db.name,
                table: "Courses",
                nullable: false,
                default: null,
                generated: false,
                maxLength: 255,
              },
            ]),
          },
          {
            id: `${db.name}.Enrollments`,
            name: "Enrollments",
            schema: db.name,

            columns: expect.arrayContaining([
              {
                id: `${db.name}.Enrollments.CourseID`,
                constraints: expect.arrayContaining(["p", "f"]),
                name: "CourseID",
                type: "int",
                schema: db.name,
                table: "Enrollments",
                nullable: false,
                default: null,
                generated: false,
                maxLength: null,
              },
              {
                id: `${db.name}.Enrollments.StudentID`,
                name: "StudentID",
                constraints: expect.arrayContaining(["p", "f"]),
                type: "int",
                schema: db.name,
                table: "Enrollments",
                nullable: false,
                default: null,
                generated: false,
                maxLength: null,
              },
            ]),
          },
          {
            id: `${db.name}.Grades`,
            name: "Grades",
            schema: db.name,

            columns: expect.arrayContaining([
              {
                id: `${db.name}.Grades.CourseID`,
                constraints: expect.arrayContaining(["p", "f"]),
                name: "CourseID",
                type: "int",
                schema: db.name,
                table: "Grades",
                nullable: false,
                default: null,
                generated: false,
                maxLength: null,
              },
              {
                id: `${db.name}.Grades.StudentID`,
                constraints: expect.arrayContaining(["p", "f"]),
                name: "StudentID",
                type: "int",
                schema: db.name,
                table: "Grades",
                nullable: false,
                default: null,
                generated: false,
                maxLength: null,
              },
              {
                id: `${db.name}.Grades.ExamName`,
                constraints: expect.arrayContaining(["p"]),
                name: "ExamName",
                type: "varchar",
                schema: db.name,
                table: "Grades",
                nullable: false,
                default: null,
                generated: false,
                maxLength: 255,
              },
              {
                id: `${db.name}.Grades.Grade`,
                constraints: [],
                name: "Grade",
                type: "float",
                schema: db.name,
                table: "Grades",
                nullable: false,
                default: null,
                generated: false,
                maxLength: null,
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
                constraints: expect.arrayContaining(["p"]),
                name: "StudentID",
                type: "int",
                schema: db.name,
                table: "Students",
                nullable: false,
                default: null,
                generated: false,
                maxLength: null,
              },
              {
                id: `${db.name}.Students.FirstName`,
                constraints: [],
                name: "FirstName",
                type: "varchar",
                schema: db.name,
                table: "Students",
                nullable: false,
                default: null,
                generated: false,
                maxLength: 255,
              },
              {
                id: `${db.name}.Students.LastName`,
                constraints: [],
                name: "LastName",
                type: "varchar",
                schema: db.name,
                table: "Students",
                nullable: false,
                default: null,
                generated: false,
                maxLength: 255,
              },
            ]),
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
                generated: false,
                id: `${publicDb.name}.Courses.CourseID`,
                maxLength: null,
                name: "CourseID",
                nullable: false,
                schema: publicDb.name,
                constraints: expect.arrayContaining(["p"]),
                table: "Courses",
                type: "bigint",
              },
              {
                default: null,
                generated: false,
                id: `${publicDb.name}.Courses.CourseName`,
                maxLength: 255,
                constraints: [],
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
                generated: false,
                id: `${publicDb.name}.Students.StudentID`,
                maxLength: null,
                name: "StudentID",
                nullable: false,
                schema: publicDb.name,
                constraints: expect.arrayContaining(["p"]),
                table: "Students",
                type: "bigint",
              },
              {
                default: null,
                generated: false,
                id: `${publicDb.name}.Students.FirstName`,
                maxLength: 255,
                name: "FirstName",
                nullable: false,
                schema: publicDb.name,
                constraints: [],
                table: "Students",
                type: "varchar",
              },
              {
                default: null,
                generated: false,
                id: `${publicDb.name}.Students.LastName`,
                maxLength: 255,
                name: "LastName",
                nullable: false,
                schema: publicDb.name,
                constraints: [],
                table: "Students",
                type: "varchar",
              },
              {
                default: null,
                generated: false,
                constraints: expect.arrayContaining(["f"]),
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
            columns: expect.arrayContaining([
              {
                default: null,
                generated: false,
                id: `${privateDb.name}.Courses.CourseID`,
                maxLength: null,
                name: "CourseID",
                constraints: expect.arrayContaining(["p"]),
                nullable: false,
                schema: privateDb.name,
                table: "Courses",
                type: "bigint",
              },
              {
                default: null,
                generated: false,
                id: `${privateDb.name}.Courses.CourseName`,
                maxLength: 255,
                name: "CourseName",
                constraints: [],
                nullable: false,
                schema: privateDb.name,
                table: "Courses",
                type: "varchar",
              },
            ]),
            id: `${privateDb.name}.Courses`,
            name: "Courses",
            schema: privateDb.name,
          },
          {
            columns: expect.arrayContaining([
              {
                default: null,
                generated: false,
                id: `${privateDb.name}.Enrollments.CourseID`,
                maxLength: null,
                name: "CourseID",
                constraints: expect.arrayContaining(["f", "u"]),
                nullable: true,
                schema: privateDb.name,
                table: "Enrollments",
                type: "bigint",
              },
              {
                default: null,
                generated: false,
                id: `${privateDb.name}.Enrollments.StudentID`,
                maxLength: null,
                name: "StudentID",
                constraints: expect.arrayContaining(["f", "u"]),
                nullable: true,
                schema: privateDb.name,
                table: "Enrollments",
                type: "bigint",
              },
            ]),
            id: `${privateDb.name}.Enrollments`,
            name: "Enrollments",
            schema: privateDb.name,
          },
          {
            columns: expect.arrayContaining([
              {
                default: null,
                generated: false,
                constraints: expect.arrayContaining(["p", "f"]),
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
                generated: false,
                constraints: expect.arrayContaining(["p", "f"]),
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
                generated: false,
                constraints: expect.arrayContaining(["p"]),
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
                generated: false,
                id: `${otherDb.name}.Grades.Grade`,
                constraints: [],
                maxLength: null,
                name: "Grade",
                nullable: false,
                schema: otherDb.name,
                table: "Grades",
                type: "float",
              },
            ]),
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
                constraints: expect.arrayContaining(["p"]),
                name: "EmployeeID",
                type: "int",
                schema: db.name,
                table: "Employees",
                nullable: false,
                default: null,
                generated: false,
                maxLength: null,
              },
              {
                id: `${db.name}.Employees.FirstName`,
                constraints: [],
                name: "FirstName",
                type: "varchar",
                schema: db.name,
                table: "Employees",
                nullable: false,
                default: null,
                generated: false,
                maxLength: 255,
              },
              {
                id: `${db.name}.Employees.LastName`,
                constraints: [],
                name: "LastName",
                type: "varchar",
                schema: db.name,
                table: "Employees",
                nullable: false,
                default: null,
                generated: false,
                maxLength: 255,
              },
              {
                id: `${db.name}.Employees.Status`,
                name: "Status",
                type: `enum.${db.name}.Employees.Status`,
                constraints: [],
                schema: db.name,
                table: "Employees",
                nullable: false,
                default: "ACTIVE",
                maxLength: 8,
                generated: false,
              },
            ]),
          },
        ]),
      );
    });

    test("should fetch generated columns infos", async () => {
      const structure = `
      CREATE TABLE test_customer (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) DEFAULT 'default_name' NOT NULL,
        email VARCHAR(255) NOT NULL,
        phone VARCHAR(255),
        full_details VARCHAR(255) AS (CONCAT(name, ' <', email, '>', ' Phone: ', IFNULL(phone, 'N/A'))) STORED
      );
      `;
      const db = await createTestDb(structure);
      const tablesInfos = await fetchTablesAndColumns(db.client, [db.name]);

      expect(tablesInfos).toEqual(
        expect.arrayContaining([
          {
            id: `${db.name}.test_customer`,
            name: "test_customer",
            schema: db.name,
            columns: expect.arrayContaining([
              {
                id: `${db.name}.test_customer.id`,
                constraints: expect.arrayContaining(["p"]),
                name: "id",
                type: "int",
                schema: db.name,
                table: "test_customer",
                nullable: false,
                default: null,
                generated: false,
                maxLength: null,
              },
              {
                id: `${db.name}.test_customer.name`,
                constraints: [],
                name: "name",
                type: "varchar",
                schema: db.name,
                table: "test_customer",
                nullable: false,
                default: "default_name",
                generated: false,
                maxLength: 255,
              },
              {
                id: `${db.name}.test_customer.email`,
                constraints: [],
                name: "email",
                type: "varchar",
                schema: db.name,
                table: "test_customer",
                nullable: false,
                default: null,
                generated: false,
                maxLength: 255,
              },
              {
                id: `${db.name}.test_customer.phone`,
                constraints: [],
                name: "phone",
                type: "varchar",
                schema: db.name,
                table: "test_customer",
                nullable: true,
                default: null,
                generated: false,
                maxLength: 255,
              },
              {
                constraints: [],
                default: null,
                generated: true,
                id: `${db.name}.test_customer.full_details`,
                maxLength: 255,
                name: "full_details",
                nullable: true,
                schema: db.name,
                table: "test_customer",
                type: "varchar",
              },
            ]),
          },
        ]),
      );
    });
  },
);
