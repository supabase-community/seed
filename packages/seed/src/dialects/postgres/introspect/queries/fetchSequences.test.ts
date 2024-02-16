import { drizzle } from "drizzle-orm/postgres-js";
import { expect, test } from "vitest";
import { postgres } from "#test";
import { fetchSequences } from "./fetchSequences.js";

const { createTestDb, createTestRole } = postgres;

test("should fetch basic sequences", async () => {
  const structure = `
    CREATE TABLE public."SequenceTest" (id integer NOT NULL);
    CREATE SEQUENCE
      public."SequenceTest_id_seq"
      AS integer
      START WITH 1
      INCREMENT BY 1
      CACHE 1
      OWNED BY public."SequenceTest".id;
  `;
  const db = await createTestDb(structure);
  const { client } = db;
  const sequences = await fetchSequences(drizzle(client));
  expect(sequences).toEqual([
    {
      column: "id",
      schema: "public",
      sequence: "SequenceTest_id_seq",
      table: "SequenceTest",
    },
  ]);
});

test("should not fetch sequences on schemas the user does not have access to", async () => {
  const structure = `
    CREATE TABLE public."SequenceTest" (id integer NOT NULL);
    CREATE SEQUENCE public."SequenceTest_id_seq"
      AS integer
      START WITH 1
      INCREMENT BY 1
      CACHE 1
      OWNED BY public."SequenceTest".id;
    CREATE SCHEMA private;
    CREATE TABLE private."PrivateSequenceTest" (id integer NOT NULL);
    CREATE SEQUENCE private."PrivateSequenceTest_id_seq"
      AS integer
      START WITH 1
      INCREMENT BY 1
      CACHE 1
      OWNED BY private."PrivateSequenceTest".id;
  `;
  const db = await createTestDb(structure);
  const testRoleClient = await createTestRole(db.client);
  const sequences = await fetchSequences(drizzle(testRoleClient.client));
  expect(sequences).toEqual([
    {
      column: "id",
      schema: "public",
      sequence: "SequenceTest_id_seq",
      table: "SequenceTest",
    },
  ]);
});

test("should fetch sequences from multiple tables", async () => {
  const structure = `
    CREATE TABLE public."FirstSequenceTest" (id integer NOT NULL);
    CREATE SEQUENCE public."FirstSequenceTest_id_seq"
      AS integer
      START WITH 1
      INCREMENT BY 1
      CACHE 1
      OWNED BY public."FirstSequenceTest".id;
    CREATE TABLE public."SecondSequenceTest" (id integer NOT NULL);
    CREATE SEQUENCE public."SecondSequenceTest_id_seq"
      AS integer
      START WITH 1
      INCREMENT BY 1
      CACHE 1
      OWNED BY public."SecondSequenceTest".id;
  `;
  const db = await createTestDb(structure);
  const { client } = db;
  const sequences = await fetchSequences(drizzle(client));
  expect(sequences).toEqual(
    expect.arrayContaining([
      {
        column: "id",
        schema: "public",
        sequence: "FirstSequenceTest_id_seq",
        table: "FirstSequenceTest",
      },
      {
        column: "id",
        schema: "public",
        sequence: "SecondSequenceTest_id_seq",
        table: "SecondSequenceTest",
      },
    ]),
  );
});

test("should handle empty result when no accessible sequences", async () => {
  const db = await createTestDb();
  const { client } = db;
  const sequences = await fetchSequences(drizzle(client));
  expect(sequences).toEqual([]);
});
