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
          schema: name,
          name: "example_seq",
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
            schema: name,
            name: "students_seq",
            current: 1,
            interval: 1,
            start: 1,
          },
          {
            schema: name,
            name: "courses_seq",
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
            schema: name,
            name: "students_seq",
            current: 3,
            interval: 1,
            start: 1,
          },
          {
            schema: name,
            name: "courses_seq",
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
            current: 1,
            interval: 1,
            name: "example1_seq",
            schema: name,
            start: 1,
          },
          {
            current: 1,
            interval: 1,
            name: "example2_seq",
            schema: name,
            start: 1,
          },
        ]),
      );
    });
  },
);
