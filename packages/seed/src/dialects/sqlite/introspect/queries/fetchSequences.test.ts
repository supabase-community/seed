import { sql } from "drizzle-orm";
import { drizzle as drizzleBetterSqlite } from "drizzle-orm/better-sqlite3";
import { describe, expect, test } from "vitest";
import { sqlite } from "#test";
import { createDrizzleORMSqliteClient } from "../../adapters.js";
import { fetchSequences } from "./fetchSequences.js";

const adapters = {
  betterSqlite3: () => ({
    ...sqlite.betterSqlite3,
    drizzle: drizzleBetterSqlite,
  }),
};

describe.each(["betterSqlite3"] as const)("fetchSequences: %s", (adapter) => {
  const { drizzle, createTestDb } = adapters[adapter]();

  test("should fetch primary key autoincrement sequence", async () => {
    const structure = `
        CREATE TABLE students (
          student_id INTEGER PRIMARY KEY AUTOINCREMENT,
          name VARCHAR(100) NOT NULL
        );
      `;
    const { client } = await createTestDb(structure);
    const sequences = await fetchSequences(
      createDrizzleORMSqliteClient(drizzle(client)),
    );
    expect(sequences).toEqual([
      {
        tableId: "students",
        colId: "student_id",
        name: "students_student_id_seq", // The exact name might differ; adjust as necessary
        current: 1,
      },
    ]);
  });

  test("should fetch rowid sequence on table wihtout primary key", async () => {
    const structure = `
        CREATE TABLE students (
          name VARCHAR(100) NOT NULL
        );
      `;
    const { client } = await createTestDb(structure);
    const sequences = await fetchSequences(
      createDrizzleORMSqliteClient(drizzle(client)),
    );
    expect(sequences).toEqual(
      expect.arrayContaining([
        {
          tableId: "students",
          colId: "rowid",
          name: "students_rowid_seq", // The exact name might differ; adjust as necessary
          current: 1,
        },
      ]),
    );

    drizzle(client).run(
      sql`
        INSERT INTO students (name) VALUES ('John Doe'), ('Jane Smith');
      `,
    );
    expect(
      await fetchSequences(createDrizzleORMSqliteClient(drizzle(client))),
    ).toEqual(
      expect.arrayContaining([
        {
          tableId: "students",
          colId: "rowid",
          name: "students_rowid_seq", // The exact name might differ; adjust as necessary
          current: 3,
        },
      ]),
    );
  });
});
