import { test as _test, type TestFunction, expect } from "vitest";
import { adapterEntries } from "#test/adapters.js";
import { setupProject } from "#test/setupProject.js";
import { type DialectRecordWithDefault } from "#test/types.js";

for (const [dialect, adapter] of adapterEntries) {
  const computeName = (name: string) => `e2e > ${dialect} > ${name}`;
  const test = (name: string, fn: TestFunction) => {
    // eslint-disable-next-line vitest/expect-expect, vitest/valid-title
    _test.concurrent(computeName(name), fn);
  };

  test("basic path connection", async () => {
    const schema: DialectRecordWithDefault = {
      default: `
        CREATE TABLE board (
          id UUID NOT NULL PRIMARY KEY,
          name TEXT NOT NULL
        );
        CREATE TABLE "column" (
          id UUID NOT NULL PRIMARY KEY,
          name TEXT NOT NULL,
          board_id UUID NOT NULL REFERENCES board(id)
        );
        CREATE TABLE item (
          id UUID NOT NULL PRIMARY KEY,
          name TEXT NOT NULL,
          column_id UUID NOT NULL REFERENCES "column"(id),
          board_id UUID NOT NULL REFERENCES board(id)
        );
      `,
      mysql: `
        CREATE TABLE board (
          id CHAR(36) NOT NULL,
          name VARCHAR(255) NOT NULL,
          PRIMARY KEY (id)
        );
        CREATE TABLE \`column\` (
          id CHAR(36) NOT NULL,
          name VARCHAR(255) NOT NULL,
          board_id CHAR(36) NOT NULL,
          PRIMARY KEY (id),
          FOREIGN KEY (board_id) REFERENCES board(id)
        );
        CREATE TABLE item (
          id CHAR(36) NOT NULL,
          name VARCHAR(255) NOT NULL,
          column_id CHAR(36) NOT NULL,
          board_id CHAR(36) NOT NULL,
          PRIMARY KEY (id),
          FOREIGN KEY (column_id) REFERENCES \`column\`(id),
          FOREIGN KEY (board_id) REFERENCES board(id)
        );
      `,
    };

    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
        import { createSeedClient } from '#snaplet/seed'
  
        const seed = await createSeedClient()
  
        await seed.boards([{
          columns: [{
            items: [{}, {}]
          }]
        }])
      `,
    });

    const boards = await db.query<{ id: string }>("SELECT * FROM board");
    const columns = await db.query<{ board_id: string; id: string }>(
      `SELECT * FROM ${adapter.escapeIdentifier("column")}`,
    );
    const items = await db.query<{
      board_id: string;
      column_id: string;
      id: string;
    }>("SELECT * FROM item");

    expect(boards).toHaveLength(1);
    expect(columns).toHaveLength(1);
    expect(items).toEqual([
      expect.objectContaining({ board_id: boards[0].id }),
      expect.objectContaining({ board_id: boards[0].id }),
    ]);
  });

  test("multiple path connections", async () => {
    const schema: DialectRecordWithDefault = {
      default: `
        CREATE TABLE board (
          id UUID NOT NULL PRIMARY KEY,
          name TEXT NOT NULL
        );
        CREATE TABLE "column" (
          id UUID NOT NULL PRIMARY KEY,
          name TEXT NOT NULL,
          board_id UUID NOT NULL REFERENCES board(id)
        );
        CREATE TABLE item (
          id UUID NOT NULL PRIMARY KEY,
          name TEXT NOT NULL,
          column_id UUID NOT NULL REFERENCES "column"(id),
          board_id UUID NOT NULL REFERENCES board(id)
        );
      `,
      mysql: `
        CREATE TABLE board (
          id CHAR(36) NOT NULL,
          name VARCHAR(255) NOT NULL,
          PRIMARY KEY (id)
        );
        CREATE TABLE \`column\` (
          id CHAR(36) NOT NULL,
          name VARCHAR(255) NOT NULL,
          board_id CHAR(36) NOT NULL,
          PRIMARY KEY (id),
          FOREIGN KEY (board_id) REFERENCES board(id)
        );
        CREATE TABLE item (
          id CHAR(36) NOT NULL,
          name VARCHAR(255) NOT NULL,
          column_id CHAR(36) NOT NULL,
          board_id CHAR(36) NOT NULL,
          PRIMARY KEY (id),
          FOREIGN KEY (column_id) REFERENCES \`column\`(id),
          FOREIGN KEY (board_id) REFERENCES board(id)
        );
      `,
    };
    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
              import { createSeedClient } from '#snaplet/seed'

              const seed = await createSeedClient()

              await seed.boards((x) => x(2, {
                columns: (x) => x(2, {
                  items: (x) => x(2)
                })
              }))
            `,
    });

    const boards = await db.query<{ id: string }>("SELECT * FROM board");
    const columns = await db.query<{ board_id: string; id: string }>(
      `SELECT * FROM ${adapter.escapeIdentifier("column")}`,
    );
    const items = await db.query<{
      board_id: string;
      column_id: string;
      id: string;
    }>("SELECT * FROM item");

    expect(boards).toHaveLength(2);
    expect(columns).toHaveLength(4);
    // Should have re-used existing boards and linked them to the items
    expect(items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ board_id: boards[0].id }),
        expect.objectContaining({ board_id: boards[0].id }),
        expect.objectContaining({ board_id: boards[0].id }),
        expect.objectContaining({ board_id: boards[0].id }),
        expect.objectContaining({ board_id: boards[1].id }),
        expect.objectContaining({ board_id: boards[1].id }),
        expect.objectContaining({ board_id: boards[1].id }),
        expect.objectContaining({ board_id: boards[1].id }),
      ]),
    );
  });

  test("connect option overrides path connection", async () => {
    const schema: DialectRecordWithDefault = {
      default: `
        CREATE TABLE board (
          id UUID NOT NULL PRIMARY KEY,
          name TEXT NOT NULL
        );
        CREATE TABLE "column" (
          id UUID NOT NULL PRIMARY KEY,
          name TEXT NOT NULL,
          board_id UUID NOT NULL REFERENCES board(id)
        );
        CREATE TABLE item (
          id UUID NOT NULL PRIMARY KEY,
          name TEXT NOT NULL,
          column_id UUID NOT NULL REFERENCES "column"(id),
          board_id UUID NOT NULL REFERENCES board(id)
        );
      `,
      mysql: `
        CREATE TABLE board (
          id CHAR(36) NOT NULL,
          name VARCHAR(255) NOT NULL,
          PRIMARY KEY (id)
        );
        CREATE TABLE \`column\` (
          id CHAR(36) NOT NULL,
          name VARCHAR(255) NOT NULL,
          board_id CHAR(36) NOT NULL,
          PRIMARY KEY (id),
          FOREIGN KEY (board_id) REFERENCES board(id)
        );
        CREATE TABLE item (
          id CHAR(36) NOT NULL,
          name VARCHAR(255) NOT NULL,
          column_id CHAR(36) NOT NULL,
          board_id CHAR(36) NOT NULL,
          PRIMARY KEY (id),
          FOREIGN KEY (column_id) REFERENCES \`column\`(id),
          FOREIGN KEY (board_id) REFERENCES board(id)
        );
      `,
    };
    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
              import { createSeedClient } from '#snaplet/seed'

              const seed = await createSeedClient()

              const store = await seed.boards([{ name: 'connected board' }])

              await seed.boards([{
                columns: [{
                  items: [{}, {}]
                }]
              }], { connect: store })
            `,
    });

    const boards = await db.query<{ id: string; name: string }>(
      "SELECT * FROM board",
    );
    const columns = await db.query<{ board_id: string; id: string }>(
      `SELECT * FROM ${adapter.escapeIdentifier("column")}`,
    );
    const items = await db.query<{
      board_id: string;
      column_id: string;
      id: string;
    }>("SELECT * FROM item");

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const connectedBoard = boards.find((b) => b.name === "connected board")!;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const pathBoard = boards.find((b) => b.name !== "connected board")!;

    expect(boards).toHaveLength(2);
    expect(columns).toEqual([
      expect.objectContaining({
        board_id: pathBoard.id,
      }),
    ]);
    expect(items).toEqual([
      expect.objectContaining({ board_id: connectedBoard.id }),
      expect.objectContaining({ board_id: connectedBoard.id }),
    ]);
  });
}
