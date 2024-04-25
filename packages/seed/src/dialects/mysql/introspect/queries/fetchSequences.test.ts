import { describe, expect, test } from "vitest";
import { mysql } from "#test/mysql/mysql/index.js";
import { fetchSequences } from "./fetchSequences.js";

const adapters = {
  mysql: () => mysql,
};

describe.concurrent.each(["mysql"] as const)(
  "fetchSequences: %s",
  (adapter) => {
    const { createTestDb } = adapters[adapter]();

    test("should fetch basic auto-increment details", async () => {
      const structure = `
        CREATE TABLE example (
          id INT AUTO_INCREMENT PRIMARY KEY
        );
      `;
      const db = await createTestDb(structure);
      const { client, name } = db;
      const sequences = await fetchSequences(client, [name]);
      expect(sequences).toEqual([
        {
          columnName: "id",
          schema: name,
          tableId: `${name}.example`,
          name: `${name}.example.id`,
          current: 1,
          interval: 1,
          start: 1,
        },
      ]);
    });

    test("should fetch auto-increment details used by tables", async () => {
      const structure = `
        CREATE TABLE students (
          student_id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL
        );
        CREATE TABLE courses (
          course_id INT AUTO_INCREMENT PRIMARY KEY,
          title VARCHAR(100) NOT NULL
        );
      `;
      const db = await createTestDb(structure);
      const { client, name } = db;
      const sequences = await fetchSequences(client, [name]);
      expect(sequences).toEqual(
        expect.arrayContaining([
          {
            columnName: "student_id",
            tableId: `${name}.students`,
            schema: name,
            name: `${name}.students.student_id`,
            current: 1,
            interval: 1,
            start: 1,
          },
          {
            columnName: "course_id",
            tableId: `${name}.courses`,
            schema: name,
            name: `${name}.courses.course_id`,
            current: 1,
            interval: 1,
            start: 1,
          },
        ]),
      );
      await client.execute(
        `
        INSERT INTO students (name) VALUES ('John Doe'), ('Jane Smith');
        INSERT INTO courses (title) VALUES ('Mathematics'), ('Science');
      `,
      );
      const updatedSequences = await fetchSequences(client, [name]);
      expect(updatedSequences).toEqual(
        expect.arrayContaining([
          {
            columnName: "student_id",
            tableId: `${name}.students`,
            schema: name,
            name: `${name}.students.student_id`,
            current: 3,
            interval: 1,
            start: 1,
          },
          {
            columnName: "course_id",
            tableId: `${name}.courses`,
            schema: name,
            name: `${name}.courses.course_id`,
            current: 3,
            interval: 1,
            start: 1,
          },
        ]),
      );
    });

    test("should handle empty result when no accessible auto-increments", async () => {
      const structure = ``; // No table created
      const db = await createTestDb(structure);
      const { client, name } = db;
      const sequences = await fetchSequences(client, [name]);
      expect(sequences).toEqual([]);
    });

    test("should fetch multiple auto-increment details across tables", async () => {
      const structure = `
        CREATE TABLE example1 (
          id INT AUTO_INCREMENT PRIMARY KEY
        );
        CREATE TABLE example2 (
          id INT AUTO_INCREMENT PRIMARY KEY
        );
      `;
      const db = await createTestDb(structure);
      const { client, name } = db;
      const sequences = await fetchSequences(client, [name]);
      expect(sequences).toEqual(
        expect.arrayContaining([
          {
            columnName: "id",
            tableId: `${name}.example1`,
            current: 1,
            interval: 1,
            name: `${name}.example1.id`,
            schema: name,
            start: 1,
          },
          {
            columnName: "id",
            tableId: `${name}.example2`,
            current: 1,
            interval: 1,
            name: `${name}.example2.id`,
            schema: name,
            start: 1,
          },
        ]),
      );
    });
  },
);
