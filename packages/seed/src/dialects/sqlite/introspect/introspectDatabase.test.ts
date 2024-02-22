import { drizzle } from "drizzle-orm/better-sqlite3";
import { expect, test } from "vitest";
import { sqlite } from "#test";
import { introspectDatabase } from "./introspectDatabase.js";

const { createTestDb } = sqlite.betterSqlite3;

test("introspectDatabase should return basic database structure", async () => {
  const structure = `
  CREATE TABLE "Table1" (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    name TEXT
  );
  `;
  const db = await createTestDb(structure);
  const result = await introspectDatabase(drizzle(db.client));
  expect(result).toMatchObject({
    server: {
      version: "3.42.0",
    },
    sequences: [
      {
        colId: "id",
        current: 1,
        interval: 1,
        max: 2147483647,
        min: 1,
        name: "Table1_id_seq",
        start: 1,
        tableId: "Table1",
      },
    ],
    tables: [
      {
        primaryKeys: {
          dirty: false,
          keys: [
            {
              affinity: "integer",
              name: "id",
              type: "INTEGER",
            },
          ],
          table: "Table1",
          tableId: "Table1",
        },
        children: [],
        parents: [],
        constraints: [
          {
            columns: ["id"],
            dirty: false,
            name: "Table1_pkey",
            table: "Table1",
            tableId: "Table1",
          },
        ],
        columns: [
          {
            affinity: "integer",
            constraints: ["p"],
            default: null,
            id: "Table1.id",
            name: "id",
            nullable: false,
            table: "Table1",
            type: "INTEGER",
            identity: {
              current: 1,
              interval: 1,
              max: 2147483647,
              min: 1,
              name: "Table1_id_seq",
              start: 1,
            },
          },
          {
            affinity: "text",
            default: null,
            identity: null,
            constraints: [],
            id: "Table1.name",
            name: "name",
            nullable: true,
            table: "Table1",
            type: "TEXT",
          },
        ],
        id: "Table1",
        name: "Table1",
        type: "table",
        strict: 0,
        wr: 0,
      },
    ],
  });
});
