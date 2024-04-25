import { describe, expect, test } from "vitest";
import { mysql } from "#test/mysql/mysql/index.js";
import { fetchDatabaseRelationships } from "./fetchDatabaseRelationships.js";

const adapters = {
  mysql: () => mysql,
};

describe.concurrent.each(["mysql"] as const)(
  "fetchDatabaseRelationships: %s",
  (adapter) => {
    const { createTestDb } = adapters[adapter]();

    test("should return empty array if no relations", async () => {
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
      const { client, name } = await createTestDb(structure);
      const relationships = await fetchDatabaseRelationships(client, [name]);
      expect(relationships.length).toEqual(0);
    });

    test("should get composite FK and basic FK", async () => {
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
      const { client, name } = await createTestDb(structure);
      const relationships = await fetchDatabaseRelationships(client, [name]);
      expect(relationships).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fkTable: `${name}.Enrollments`,
            targetTable: `${name}.Courses`,
            keys: [
              {
                fkColumn: "CourseID",
                fkType: "int",
                targetColumn: "CourseID",
                targetType: "int",
                nullable: false,
              },
            ],
          }),
          expect.objectContaining({
            fkTable: `${name}.Enrollments`,
            targetTable: `${name}.Students`,
            keys: [
              {
                fkColumn: "StudentID",
                fkType: "int",
                targetColumn: "StudentID",
                targetType: "int",
                nullable: false,
              },
            ],
          }),
          expect.objectContaining({
            fkTable: `${name}.Grades`,
            targetTable: `${name}.Enrollments`,
            keys: [
              {
                fkColumn: "CourseID",
                fkType: "int",
                targetColumn: "CourseID",
                targetType: "int",
                nullable: false,
              },
              {
                fkColumn: "StudentID",
                fkType: "int",
                targetColumn: "StudentID",
                targetType: "int",
                nullable: false,
              },
            ],
          }),
        ]),
      );
    });

    test("should get FK on multiple databases", async () => {
      const structure = `
        CREATE TABLE Courses (
            CourseID INT AUTO_INCREMENT PRIMARY KEY,
            CourseName VARCHAR(255) NOT NULL
        );
        CREATE TABLE Students (
            StudentID INT AUTO_INCREMENT PRIMARY KEY,
            FirstName VARCHAR(255) NOT NULL,
            LastName VARCHAR(255) NOT NULL,
            StudentCourseId INT NOT NULL,
            FOREIGN KEY (StudentCourseId) REFERENCES Courses(CourseID)
        );
      `;
      const { client, name } = await createTestDb(structure);
      const db2 = await createTestDb(`
        CREATE TABLE Courses (
            CourseID INT AUTO_INCREMENT PRIMARY KEY,
            CourseName VARCHAR(255) NOT NULL
        );
        CREATE TABLE Enrollments (
            CourseID INT NOT NULL,
            PRIMARY KEY (CourseID),
            FOREIGN KEY (CourseID) REFERENCES Courses(CourseID)
        );
      `);
      const relationships = await fetchDatabaseRelationships(client, [
        name,
        db2.name,
      ]);
      expect(relationships).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fkTable: `${name}.Students`,
            targetTable: `${name}.Courses`,
            keys: [
              {
                fkColumn: "StudentCourseId",
                fkType: "int",
                targetColumn: "CourseID",
                targetType: "int",
                nullable: false,
              },
            ],
          }),
          expect.objectContaining({
            fkTable: `${db2.name}.Enrollments`,
            targetTable: `${db2.name}.Courses`,
            keys: [
              {
                fkColumn: "CourseID",
                fkType: "int",
                targetColumn: "CourseID",
                targetType: "int",
                nullable: false,
              },
            ],
          }),
        ]),
      );
    });

    test("should get FK on multiples databases and nullables", async () => {
      const db1 = await createTestDb(
        `
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
      `,
      );

      const db2 = await createTestDb(
        `
        CREATE TABLE Courses (
            CourseID INT AUTO_INCREMENT PRIMARY KEY,
            CourseName VARCHAR(255) NOT NULL
        );
        CREATE TABLE Enrollments (
            CourseID INT,
            StudentID INT,
            UNIQUE (CourseID, StudentID),
            FOREIGN KEY (CourseID) REFERENCES Courses(CourseID)
        );
      `,
      );

      const db3 = await createTestDb(
        `
        CREATE TABLE Grades (
            CourseID INT,
            StudentID INT,
            ExamName VARCHAR(255),
            Grade FLOAT NOT NULL,
            PRIMARY KEY (CourseID, StudentID, ExamName),
            FOREIGN KEY (CourseID, StudentID) REFERENCES \`${db2.name}\`.Enrollments(CourseID, StudentID)
        );
      `,
      );

      const relationships = await fetchDatabaseRelationships(db1.client, [
        db1.name,
        db2.name,
        db3.name,
      ]);
      expect(relationships).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            fkTable: `${db2.name}.Enrollments`,
            targetTable: `${db2.name}.Courses`,
            keys: [
              {
                fkColumn: "CourseID",
                fkType: "int",
                nullable: true,
                targetColumn: "CourseID",
                targetType: "int",
              },
            ],
          }),
          expect.objectContaining({
            fkTable: `${db3.name}.Grades`,
            targetTable: `${db2.name}.Enrollments`,
            keys: [
              {
                fkColumn: "CourseID",
                fkType: "int",
                nullable: false,
                targetColumn: "CourseID",
                targetType: "int",
              },
              {
                fkColumn: "StudentID",
                fkType: "int",
                nullable: false,
                targetColumn: "StudentID",
                targetType: "int",
              },
            ],
          }),
          expect.objectContaining({
            fkTable: `${db1.name}.Students`,
            targetTable: `${db1.name}.Courses`,
            keys: [
              {
                fkColumn: "StudentCourseId",
                fkType: "int",
                nullable: true,
                targetColumn: "CourseID",
                targetType: "int",
              },
            ],
          }),
        ]),
      );
    });
  },
);
