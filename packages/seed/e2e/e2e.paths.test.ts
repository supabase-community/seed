import { test as _test, type TestFunction, expect } from "vitest";
import { adapterEntries } from "#test/adapters.js";
import { setupProject } from "#test/setupProject.js";

for (const [dialect, adapter] of adapterEntries) {
  const computeName = (name: string) => `e2e > ${dialect} > ${name}`;
  const test = (name: string, fn: TestFunction) => {
    // eslint-disable-next-line vitest/expect-expect, vitest/valid-title
    _test.concurrent(computeName(name), fn);
  };

  test("basic path connection", async () => {
    const { db } = await setupProject({
      adapter,
      databaseSchema: `
        create table board (
          id uuid not null primary key,
          name text not null
        );
        create table "column" (
          id uuid not null primary key,
          name text not null,
          board_id uuid not null references board(id)
        );
        create table item (
          id uuid not null primary key,
          name text not null,
          column_id uuid not null references "column"(id),
          board_id uuid not null references board(id)
        );
      `,
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

    const boards = await db.query<{ id: string }>("select * from board");
    const columns = await db.query('select * from "column"');
    const items = await db.query("select * from item");

    expect(boards).toHaveLength(1);
    expect(columns).toHaveLength(1);
    expect(items).toEqual([
      expect.objectContaining({ board_id: boards[0].id }),
      expect.objectContaining({ board_id: boards[0].id }),
    ]);
  });

  test("multiple path connections", async () => {
    const { db } = await setupProject({
      adapter,
      databaseSchema: `
              create table board (
                id uuid not null primary key,
                name text not null
              );
              create table "column" (
                id uuid not null primary key,
                name text not null,
                board_id uuid not null references board(id)
              );
              create table item (
                id uuid not null primary key,
                name text not null,
                column_id uuid not null references "column"(id),
                board_id uuid not null references board(id)
              );
            `,
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

    const boards = await db.query<{ id: string }>("select * from board");
    const columns = await db.query('select * from "column"');
    const items = await db.query("select * from item");

    expect(boards).toHaveLength(2);
    expect(columns).toHaveLength(4);
    expect(items).toEqual([
      expect.objectContaining({ board_id: boards[0].id }),
      expect.objectContaining({ board_id: boards[0].id }),
      expect.objectContaining({ board_id: boards[0].id }),
      expect.objectContaining({ board_id: boards[0].id }),
      expect.objectContaining({ board_id: boards[1].id }),
      expect.objectContaining({ board_id: boards[1].id }),
      expect.objectContaining({ board_id: boards[1].id }),
      expect.objectContaining({ board_id: boards[1].id }),
    ]);
  });

  test("connect option overrides path connection", async () => {
    const { db } = await setupProject({
      adapter,
      databaseSchema: `
              create table board (
                id uuid not null primary key,
                name text not null
              );
              create table "column" (
                id uuid not null primary key,
                name text not null,
                board_id uuid not null references board(id)
              );
              create table item (
                id uuid not null primary key,
                name text not null,
                column_id uuid not null references "column"(id),
                board_id uuid not null references board(id)
              );
            `,
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
      "select * from board",
    );
    const columns = await db.query('select * from "column"');
    const items = await db.query("select * from item");

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
