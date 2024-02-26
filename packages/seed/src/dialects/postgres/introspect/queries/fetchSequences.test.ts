import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { drizzle as drizzleJs } from "drizzle-orm/postgres-js";
import { describe, expect, test } from "vitest";
import { postgres } from "#test";
import { createDrizzleORMPgClient } from "../../adapters.js";
import { fetchSequences } from "./fetchSequences.js";

const adapters = {
  postgresJs: () => ({
    ...postgres.postgresJs,
    drizzle: drizzleJs,
  }),
  pg: () => ({
    ...postgres.pg,
    drizzle: drizzlePg,
  }),
};

describe.each(["postgresJs", "pg"] as const)(
  "fetchSequences: %s",
  (adapter) => {
    const { drizzle, createTestDb } = adapters[adapter]();

    test("should fetch basic sequences", async () => {
      const structure = `
    CREATE SEQUENCE public.seq_example INCREMENT 1 START 1;
  `;
      const db = await createTestDb(structure);
      const { client } = db;
      const sequences = await fetchSequences(
        //@ts-expect-error dynamic import based on adapter
        createDrizzleORMPgClient(drizzle(client)),
      );
      expect(sequences).toEqual([
        {
          schema: "public",
          name: "seq_example",
          current: 1, // Current value might be '1' if not used yt
          interval: 1,
        },
      ]);
    });

    test("should fetch sequences used by tables", async () => {
      const structure = `
    CREATE TABLE public.students (
      student_id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL
    );
    CREATE TABLE public.courses (
      course_id SERIAL PRIMARY KEY,
      title VARCHAR(100) NOT NULL
    );
    -- Assuming SERIAL creates a sequence named 'students_student_id_seq' and 'courses_course_id_seq'
  `;
      const db = await createTestDb(structure);
      const { client } = db;
      const ormClient =
        //@ts-expect-error dynamic import based on adapter
        createDrizzleORMPgClient(drizzle(client));
      const sequences = await fetchSequences(ormClient);
      expect(sequences).toEqual(
        expect.arrayContaining([
          {
            schema: "public",
            name: "students_student_id_seq", // The exact name might differ; adjust as necessary
            current: 1,
            interval: 1,
          },
          {
            schema: "public",
            name: "courses_course_id_seq", // The exact name might differ; adjust as necessary
            current: 1,
            interval: 1,
          },
        ]),
      );
      await ormClient.run(
        `
        INSERT INTO public.students (name) VALUES ('John Doe'), ('Jane Smith');
        INSERT INTO public.courses (title) VALUES ('Mathematics'), ('Science');`,
      );
      const result = await fetchSequences(ormClient);

      expect(result).toEqual(
        expect.arrayContaining([
          {
            schema: "public",
            name: "students_student_id_seq", // The exact name might differ; adjust as necessary
            current: 3,
            interval: 1,
          },
          {
            schema: "public",
            name: "courses_course_id_seq", // The exact name might differ; adjust as necessary
            current: 3,
            interval: 1,
          },
        ]),
      );
    });

    test("should handle empty result when no accessible sequences", async () => {
      const structure = ``;
      const db = await createTestDb(structure);
      const { client } = db;
      const sequences = await fetchSequences(
        //@ts-expect-error dynamic import based on adapter
        createDrizzleORMPgClient(drizzle(client)),
      );
      expect(sequences).toEqual([]);
    });

    test("should fetch multiple sequences", async () => {
      const structure = `
    CREATE SEQUENCE public.seq_example1 INCREMENT 1 START 1;
    CREATE SEQUENCE public.seq_example2 INCREMENT 1 START 50;
  `;
      const db = await createTestDb(structure);
      const { client } = db;
      const sequences = await fetchSequences(
        //@ts-expect-error dynamic import based on adapter
        createDrizzleORMPgClient(drizzle(client)),
      );
      expect(sequences).toEqual(
        expect.arrayContaining([
          {
            current: 1,
            interval: 1,
            name: "seq_example1",
            schema: "public",
          },
          {
            current: 50,
            interval: 1,
            name: "seq_example2",
            schema: "public",
          },
        ]),
      );
    });

    test("should fetch multiple sequences across schemas", async () => {
      const structure = `
    CREATE SCHEMA extra;
    CREATE SEQUENCE public.seq_public INCREMENT BY 1 START WITH 1;
    CREATE SEQUENCE extra.seq_extra INCREMENT BY 1 START WITH 1;
  `;
      const db = await createTestDb(structure);
      const { client } = db;
      const sequences = await fetchSequences(
        //@ts-expect-error dynamic import based on adapter
        createDrizzleORMPgClient(drizzle(client)),
      );
      expect(sequences).toEqual(
        expect.arrayContaining([
          {
            schema: "public",
            name: "seq_public",
            current: 1,
            interval: 1,
          },
          {
            schema: "extra",
            name: "seq_extra",
            current: 1,
            interval: 1,
          },
        ]),
      );
    });
  },
);
