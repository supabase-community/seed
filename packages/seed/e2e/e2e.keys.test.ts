import { test as _test, type TestFunction, expect } from "vitest";
import { adapterEntries } from "#test/adapters.js";
import { setupProject } from "#test/setupProject.js";
import { type DialectRecordWithDefault } from "#test/types.js";

for (const [dialect, adapter] of adapterEntries) {
  const computeName = (name: string) => `e2e > keys > ${dialect} > ${name}`;
  const test = (name: string, fn: TestFunction) => {
    // eslint-disable-next-line vitest/expect-expect, vitest/valid-title
    _test.concurrent(computeName(name), fn);
  };

  test("work as expected with composites primary keys", async () => {
    const schema: DialectRecordWithDefault = {
      default: `
          CREATE TABLE "Team" (
            "id" SERIAL PRIMARY KEY
          );
          CREATE TABLE "Player" (
            "id" BIGSERIAL PRIMARY KEY,
            "teamId" integer NOT NULL REFERENCES "Team"("id"),
            "name" text NOT NULL
          );
          CREATE TABLE "Game" (
            "id" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY
          );
          -- Create a Match table with a composite primary key based on two foreign keys
          CREATE TABLE "Match" (
            "teamId" integer REFERENCES "Team"("id"),
            "gameId" integer REFERENCES "Game"("id"),
            "score" integer NOT NULL,
            PRIMARY KEY ("teamId", "gameId")
          );
        `,
      sqlite: `
        CREATE TABLE "Team" (
          "id" INTEGER PRIMARY KEY AUTOINCREMENT
        );
        CREATE TABLE "Player" (
          "id" INTEGER PRIMARY KEY AUTOINCREMENT,
          "teamId" INTEGER NOT NULL,
          "name" TEXT NOT NULL,
          FOREIGN KEY ("teamId") REFERENCES "Team"("id")
        );
        CREATE TABLE "Game" (
          "id" INTEGER PRIMARY KEY AUTOINCREMENT
        );
        -- Composite primary key in SQLite
        CREATE TABLE "Match" (
          "teamId" INTEGER NOT NULL,
          "gameId" INTEGER NOT NULL,
          "score" INTEGER NOT NULL,
          PRIMARY KEY ("teamId", "gameId"),
          FOREIGN KEY ("teamId") REFERENCES "Team"("id"),
          FOREIGN KEY ("gameId") REFERENCES "Game"("id")
        );`,
    };
    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
        import { createSeedClient } from '#snaplet/seed'
          const seed = await createSeedClient({ dryRun: false })
          await seed.teams((x) => x(2, {
            players: (x) => x(3)
          }));
          // Assuming seed.matches connects matches to existing teams and games
          await seed.matches((x) => x(3), { connect: true });
        `,
    });

    const teams = await db.query<{ id: number }>('SELECT * FROM "Team"');
    expect(teams.length).toEqual(2);
    const players = await db.query<{
      id: number;
      name: string;
      teamId: number;
    }>('SELECT * FROM "Player"');
    expect(players.length).toEqual(6);
    const games = await db.query<{ id: number }>('SELECT * FROM "Game"');
    expect(games.length).toEqual(3);
    const matches = await db.query<{
      gameId: number;
      score: number;
      teamId: number;
    }>('SELECT * FROM "Match"');
    expect(matches.length).toEqual(3);

    // Assuming db.query returns an array of objects with column names as keys
    const teamIDs = teams.map((row) => Number(row.id)).sort((a, b) => a - b);
    const playerIDs = players
      .map((row) => Number(row.id))
      .sort((a, b) => a - b);
    const gameIDs = games.map((row) => Number(row.id)).sort((a, b) => a - b);

    expect(teamIDs).toEqual([1, 2]);
    expect(playerIDs).toEqual([1, 2, 3, 4, 5, 6]);
    expect(gameIDs).toEqual([1, 2, 3]);
    // Adapt your expectation for matches to the actual data and structure you expect
    expect(matches).toEqual([
      { gameId: 1, score: expect.any(Number), teamId: 1 },
      { gameId: 2, score: expect.any(Number), teamId: 1 },
      { gameId: 3, score: expect.any(Number), teamId: 2 },
    ]);
  });

  test("work as expected with composite primary keys made by non nullable unique index", async () => {
    const schema: DialectRecordWithDefault = {
      default: `
          CREATE TABLE "Team" (
            "id" SERIAL PRIMARY KEY
          );
          CREATE TABLE "Player" (
            "id" BIGSERIAL PRIMARY KEY,
            "teamId" integer NOT NULL REFERENCES "Team"("id"),
            "name" text NOT NULL
          );
          CREATE TABLE "Game" (
            "id" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY
          );
          -- Original Match table with a composite key made unique
          CREATE TABLE "Match" (
            "teamId" integer NOT NULL REFERENCES "Team"("id"),
            "gameId" integer NOT NULL REFERENCES "Game"("id"),
            "score" integer NOT NULL,
            UNIQUE ("teamId", "gameId")
          );
        `,
      sqlite: `
          CREATE TABLE "Team" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT
          );
          CREATE TABLE "Player" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "teamId" INTEGER NOT NULL,
            "name" TEXT NOT NULL,
            FOREIGN KEY ("teamId") REFERENCES "Team"("id")
          );
          CREATE TABLE "Game" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT
          );
          -- Adjusted Match table for SQLite
          CREATE TABLE "Match" (
            "teamId" INTEGER NOT NULL,
            "gameId" INTEGER NOT NULL,
            "score" INTEGER NOT NULL,
            FOREIGN KEY ("teamId") REFERENCES "Team"("id"),
            FOREIGN KEY ("gameId") REFERENCES "Game"("id"),
            UNIQUE ("teamId", "gameId")
          );
        `,
    };
    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
          import { createSeedClient } from '#snaplet/seed'
          const seed = await createSeedClient({ dryRun: false })
          await seed.teams((x) => x(2, {
            players: (x) => x(3)
          }));
          // Assuming seed.matches attempts to connect matches to existing teams and games
          await seed.matches((x) => x(3), { connect: true });
        `,
    });

    // Perform the queries and assertions similar to the previous tests

    const teams = await db.query<{ id: number }>('SELECT * FROM "Team"');
    expect(teams.length).toEqual(2);
    const players = await db.query<{
      id: number;
      name: string;
      teamId: number;
    }>('SELECT * FROM "Player"');
    expect(players.length).toEqual(6);
    const games = await db.query<{ id: number }>('SELECT * FROM "Game"');
    expect(games.length).toEqual(3);
    const matches = await db.query<{
      gameId: number;
      score: number;
      teamId: number;
    }>('SELECT * FROM "Match"');
    expect(matches.length).toEqual(3);

    const teamIDs = teams.map((row) => Number(row.id)).sort((a, b) => a - b);
    const playerIDs = players
      .map((row) => Number(row.id))
      .sort((a, b) => a - b);
    expect(teamIDs).toEqual([1, 2]);
    expect(playerIDs).toEqual([1, 2, 3, 4, 5, 6]);
    expect(matches).toEqual([
      { gameId: 1, score: expect.any(Number), teamId: 1 },
      { gameId: 2, score: expect.any(Number), teamId: 1 },
      { gameId: 3, score: expect.any(Number), teamId: 2 },
    ]);
  });

  test("work as expected with composite primary keys made by nullable unique index", async () => {
    const schema: DialectRecordWithDefault = {
      default: `
          CREATE TABLE "Team" (
            "id" SERIAL PRIMARY KEY
          );
          CREATE TABLE "Player" (
            "id" BIGSERIAL PRIMARY KEY,
            "teamId" integer NOT NULL REFERENCES "Team"("id"),
            "name" text NOT NULL
          );
          CREATE TABLE "Game" (
            "id" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY
          );
          -- Original Match table allowing nullable composite keys
          CREATE TABLE "Match" (
            "teamId" integer REFERENCES "Team"("id"),
            "gameId" integer REFERENCES "Game"("id"),
            "score" integer NOT NULL,
            UNIQUE ("teamId", "gameId")
          );
        `,
      sqlite: `
          CREATE TABLE "Team" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT
          );
          CREATE TABLE "Player" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "teamId" INTEGER NOT NULL,
            "name" TEXT NOT NULL,
            FOREIGN KEY ("teamId") REFERENCES "Team"("id")
          );
          CREATE TABLE "Game" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT
          );
          -- Adjusted Match table for SQLite, explicitly allowing NULLs in composite unique keys
          CREATE TABLE "Match" (
            "teamId" INTEGER,
            "gameId" INTEGER,
            "score" INTEGER NOT NULL,
            FOREIGN KEY ("teamId") REFERENCES "Team"("id"),
            FOREIGN KEY ("gameId") REFERENCES "Game"("id"),
            UNIQUE ("teamId", "gameId")
          );
        `,
    };
    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
          import { createSeedClient } from '#snaplet/seed'
          const seed = await createSeedClient({ dryRun: false })
          await seed.teams((x) => x(2, {
            players: (x) => x(3)
          }));
          await seed.matches((x) => x(3), { connect: true });
        `,
    });

    // Perform the queries and assertions
    const teams = await db.query<{ id: number }>('SELECT * FROM "Team"');
    expect(teams.length).toEqual(2);
    const players = await db.query<{
      id: number;
      name: string;
      teamId: number;
    }>('SELECT * FROM "Player"');
    expect(players.length).toEqual(6);
    const games = await db.query<{ id: number }>('SELECT * FROM "Game"');
    // Expected to have no games inserted; adjust based on seed logic
    expect(games.length).toEqual(0);
    const matches = await db.query<{
      gameId: null | number;
      score: number;
      teamId: null | number;
    }>('SELECT * FROM "Match" ORDER BY "score"');
    expect(matches.length).toEqual(3);

    // Assertions for IDs and matches according to your test setup
    const teamIDs = teams.map((team) => Number(team.id)).sort((a, b) => a - b);
    const playerIDs = players
      .map((player) => Number(player.id))
      .sort((a, b) => a - b);
    expect(teamIDs).toEqual([1, 2]);
    expect(playerIDs).toEqual([1, 2, 3, 4, 5, 6]);

    // Only in postgres dialect it's possible for a table to have no primary key or UNIQUE NON NULLABLE index
    // on sqlite we'll always fallback on the table rowid and be able to do the connection
    if (dialect === "postgres") {
      // Matches will have null values for teamId and gameId due to the fact there is not PK on this table to perform subsequent UPDATE
      expect(matches).toEqual([
        { teamId: null, gameId: null, score: expect.any(Number) },
        { teamId: null, gameId: null, score: expect.any(Number) },
        { teamId: null, gameId: null, score: expect.any(Number) },
      ]);
    } else {
      expect(matches).toEqual([
        {
          teamId: expect.any(Number),
          gameId: null,
          score: expect.any(Number),
        },
        {
          teamId: expect.any(Number),
          gameId: null,
          score: expect.any(Number),
        },
        {
          teamId: expect.any(Number),
          gameId: null,
          score: expect.any(Number),
        },
      ]);
    }
  });

  test("work as expected and UPDATE children with PRIMARY KEY field", async () => {
    const schema: DialectRecordWithDefault = {
      default: `
          CREATE TABLE "Team" (
            "id" SERIAL PRIMARY KEY
          );
          CREATE TABLE "Player" (
            "id" BIGSERIAL PRIMARY KEY,
            "teamId" integer NOT NULL REFERENCES "Team"("id"),
            "name" text NOT NULL
          );
          CREATE TABLE "Game" (
            "id" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY
          );
          -- Composite primary key on "gameId" for "Match" table
          CREATE TABLE "Match" (
            "teamId" integer REFERENCES "Team"("id"),
            "gameId" integer NOT NULL REFERENCES "Game"("id"),
            "score" integer NOT NULL,
            PRIMARY KEY ("gameId")
          );
        `,
      sqlite: `
          CREATE TABLE "Team" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT
          );
          CREATE TABLE "Player" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "teamId" INTEGER NOT NULL,
            "name" TEXT NOT NULL,
            FOREIGN KEY ("teamId") REFERENCES "Team"("id")
          );
          CREATE TABLE "Game" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT
          );
          -- Adjusted "Match" table for SQLite with "gameId" as PRIMARY KEY
          CREATE TABLE "Match" (
            "teamId" INTEGER,
            "gameId" INTEGER NOT NULL,
            "score" INTEGER NOT NULL,
            PRIMARY KEY ("gameId"),
            FOREIGN KEY ("teamId") REFERENCES "Team"("id"),
            FOREIGN KEY ("gameId") REFERENCES "Game"("id")
          );
        `,
    };
    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
          import { createSeedClient } from '#snaplet/seed'
          const seed = await createSeedClient({ dryRun: false })
          await seed.teams((x) => x(2, {
            players: (x) => x(3)
          }))
          await seed.matches((x) => x(3), { connect: true })
        `,
    });

    // Your query and assertion logic
    const teams = await db.query<{ id: number }>('SELECT * FROM "Team"');
    expect(teams.length).toEqual(2);
    const players = await db.query<{
      id: number;
      name: string;
      teamId: number;
    }>('SELECT * FROM "Player"');
    expect(players.length).toEqual(6);
    const games = await db.query<{ id: number }>('SELECT * FROM "Game"');
    expect(games.length).toEqual(3);
    const matches = await db.query<{
      gameId: number;
      score: number;
      teamId: null | number;
    }>('SELECT * FROM "Match"');
    expect(matches.length).toEqual(3);

    // Additional assertions as needed, similar to previous structure
    const teamIDs = teams.map((team) => team.id).sort((a, b) => a - b);
    const playerIDs = players
      .map((player) => Number(player.id))
      .sort((a, b) => a - b);
    // Adapt for your db query response format
    expect(teamIDs).toEqual([1, 2]);
    expect(playerIDs).toEqual([1, 2, 3, 4, 5, 6]);
    // Verify match records as per your requirements
    expect(matches).toEqual([
      { gameId: 1, score: expect.any(Number), teamId: 1 },
      { gameId: 2, score: expect.any(Number), teamId: 1 },
      { gameId: 3, score: expect.any(Number), teamId: 2 },
    ]);
  });

  test("work as expected and UPDATE children with UNIQUE NON NULLABLE field", async () => {
    const schema: DialectRecordWithDefault = {
      default: `
          CREATE TABLE "Team" (
            "id" SERIAL PRIMARY KEY
          );
          CREATE TABLE "Player" (
            "id" BIGSERIAL PRIMARY KEY,
            "teamId" integer NOT NULL REFERENCES "Team"("id"),
            "name" text NOT NULL
          );
          CREATE TABLE "Game" (
            "id" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY
          );
          -- Match table with "gameId" as a UNIQUE NON NULLABLE field
          CREATE TABLE "Match" (
            "teamId" integer REFERENCES "Team"("id"),
            "gameId" integer NOT NULL REFERENCES "Game"("id"),
            "score" integer NOT NULL,
            UNIQUE ("gameId")
          );
        `,
      sqlite: `
          CREATE TABLE "Team" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT
          );
          CREATE TABLE "Player" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT,
            "teamId" INTEGER NOT NULL,
            "name" TEXT NOT NULL,
            FOREIGN KEY ("teamId") REFERENCES "Team"("id")
          );
          CREATE TABLE "Game" (
            "id" INTEGER PRIMARY KEY AUTOINCREMENT
          );
          -- Adjusted Match table for SQLite with UNIQUE constraint on "gameId"
          CREATE TABLE "Match" (
            "teamId" INTEGER,
            "gameId" INTEGER NOT NULL UNIQUE,
            "score" INTEGER NOT NULL,
            FOREIGN KEY ("teamId") REFERENCES "Team"("id"),
            FOREIGN KEY ("gameId") REFERENCES "Game"("id")
          );
        `,
    };
    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
          import { createSeedClient } from "#snaplet/seed"
          const seed = await createSeedClient()
          await seed.teams((x) => x(2, {
            players: (x) => x(3)
          }))
          await seed.matches((x) => x(3), { connect: true })
        `,
    });

    // Your query and assertion logic
    const teams = await db.query<{ id: number }>('SELECT * FROM "Team"');
    expect(teams.length).toEqual(2);
    const players = await db.query<{
      id: number;
      name: string;
      teamId: number;
    }>('SELECT * FROM "Player"');
    expect(players.length).toEqual(6);
    const games = await db.query<{ id: number }>('SELECT * FROM "Game"');
    expect(games.length).toEqual(3);
    const matches = await db.query<{
      gameId: number;
      score: number;
      teamId: null | number; // Reflecting possible nullable foreign key
    }>('SELECT * FROM "Match"');
    expect(matches.length).toEqual(3);

    // Additional assertions for ID sequences and match specifics
    const teamIDs = teams.map((team) => team.id).sort((a, b) => a - b);
    const playerIDs = players
      .map((player) => Number(player.id))
      .sort((a, b) => a - b);
    // Ensuring the "gameId" uniqueness is maintained
    expect(teamIDs).toEqual([1, 2]);
    expect(playerIDs).toEqual([1, 2, 3, 4, 5, 6]);
    expect(matches).toEqual([
      { gameId: 1, score: expect.any(Number), teamId: 1 },
      { gameId: 2, score: expect.any(Number), teamId: 1 },
      { gameId: 3, score: expect.any(Number), teamId: 2 },
    ]);
  });

  test("should handle auto circular references", async () => {
    const schema: DialectRecordWithDefault = {
      default: `
          create table customer (
            id serial primary key,
            name text not null,
            referrer_id integer references customer(id)
          );
        `,
      sqlite: `
        create table customer (
          id integer primary key autoincrement not null,
          name text not null,
          referrer_id integer references customer(id)
        );
        `,
    };
    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
          import { createSeedClient } from "#snaplet/seed"
          const seed = await createSeedClient()
          await seed.customers([
            { name: "John Doe", referrerId: 2 },
            { name: "Jane Doe", referrerId: 1 },
          ]);
        `,
    });
    const results = await db.query(`select * from customer order by id asc`);
    expect(results).toEqual(
      expect.arrayContaining([
        {
          id: 1,
          name: "John Doe",
          referrer_id: 2,
        },
        {
          id: 2,
          name: "Jane Doe",
          referrer_id: 1,
        },
      ]),
    );
  });

  test("should connect auto circular references", async () => {
    const schema: DialectRecordWithDefault = {
      default: `
          create table customer (
            id serial primary key,
            name text not null,
            referrer_id integer references customer(id)
          );
        `,
      sqlite: `
        create table customer (
          id integer primary key autoincrement not null,
          name text not null,
          referrer_id integer references customer(id)
        );
        `,
    };
    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
          import { createSeedClient } from "#snaplet/seed"
          const seed = await createSeedClient()
          const {customers} = await seed.customers([{name: "John Doe"}])
          await seed.customers([{name: "Jane Doe"}], {connect: {customers}})
        `,
    });
    const results = await db.query(`select * from customer order by id asc`);
    expect(results).toEqual(
      expect.arrayContaining([
        {
          id: 1,
          name: "John Doe",
          referrer_id: null,
        },
        {
          id: 2,
          name: "Jane Doe",
          referrer_id: 1,
        },
      ]),
    );
  });

  test("should handle complex circular references", async () => {
    const schema: DialectRecordWithDefault = {
      default: `
            create table customer (
              id serial primary key,
              name text not null,
              last_order_id integer
            );

            create table product (
              id serial primary key,
              name text not null,
              first_order_id integer
            );

            create table "order" (
              id serial primary key,
              customer_id integer not null,
              product_id integer not null,
              quantity integer not null,
              CONSTRAINT fk_customer
                FOREIGN KEY(customer_id)
                REFERENCES customer(id),
              CONSTRAINT fk_product
                FOREIGN KEY(product_id)
                REFERENCES product(id)
            );
            -- Add constraints to customer and product tables
            alter table customer add constraint fk_last_order
              foreign key (last_order_id) references "order"(id);

            alter table product add constraint fk_first_order
              foreign key (first_order_id) references "order"(id);
        `,
      sqlite: `
        create table customer (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          last_order_id INTEGER,
          FOREIGN KEY(last_order_id) REFERENCES "order"(id)
        );
        create table product (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          first_order_id INTEGER,
          FOREIGN KEY(first_order_id) REFERENCES "order"(id)
        );
        create table "order" (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL,
          FOREIGN KEY(customer_id) REFERENCES customer(id),
          FOREIGN KEY(product_id) REFERENCES product(id)
        );
        PRAGMA foreign_keys = ON;
        `,
    };
    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
          import { createSeedClient } from "#snaplet/seed"
          const seed = await createSeedClient()
          // Create a new customer
          const customersStore = await seed.customers([
            { name: "John Doe" },
          ]);
          // Create an order and a product on this customer, set the first order id on the product
          // to match the order id
          await seed.orders([{
            quantity: 10,
            productsByFirstOrderId: {
              firstOrderId: 1,
              name: "Gadget",
            }
          }], { connect: customersStore });
        `,
    });
    const customerResults = await db.query(
      `select * from customer order by id asc`,
    );
    const orderResults = await db.query(
      `select * from "order" order by id asc`,
    );
    const productResults = await db.query(
      `select * from product order by id asc`,
    );
    expect(customerResults).toEqual(
      expect.arrayContaining([
        {
          id: 1,
          name: "John Doe",
          last_order_id: null,
        },
      ]),
    );

    expect(orderResults).toEqual(
      expect.arrayContaining([
        {
          id: 1,
          customer_id: 1,
          product_id: 1,
          quantity: 10,
        },
      ]),
    );

    expect(productResults).toEqual(
      expect.arrayContaining([
        {
          id: 1,
          name: "Gadget",
          first_order_id: 1,
        },
      ]),
    );
  });

  test("should handle circular references with bigger circular loop", async () => {
    const schema: DialectRecordWithDefault = {
      default: `
          -- Create tables without foreign keys that reference "order"
          create table customer (
            id serial primary key,
            name text not null,
            last_order_id integer
          );

          create table product (
            id serial primary key,
            name text not null,
            first_order_id integer
          );

          create table supplier (
            id serial primary key,
            name text not null,
            first_shipment_id integer
          );

          -- Now create the order and shipment tables
          create table "order" (
            id serial primary key,
            customer_id integer not null,
            product_id integer not null,
            quantity integer not null,
            shipment_id integer
          );

          create table shipment (
            id serial primary key,
            order_id integer not null,
            supplier_id integer not null
          );

          -- After all tables are created, add the foreign key constraints
          ALTER TABLE customer ADD CONSTRAINT fk_customer_last_order FOREIGN KEY(last_order_id) REFERENCES "order"(id);
          ALTER TABLE product ADD CONSTRAINT fk_product_first_order FOREIGN KEY(first_order_id) REFERENCES "order"(id);
          ALTER TABLE supplier ADD CONSTRAINT fk_supplier_first_shipment FOREIGN KEY(first_shipment_id) REFERENCES shipment(id);

          ALTER TABLE "order" ADD CONSTRAINT fk_order_customer FOREIGN KEY(customer_id) REFERENCES customer(id);
          ALTER TABLE "order" ADD CONSTRAINT fk_order_product FOREIGN KEY(product_id) REFERENCES product(id);
          ALTER TABLE "order" ADD CONSTRAINT fk_order_shipment FOREIGN KEY(shipment_id) REFERENCES shipment(id);

          ALTER TABLE shipment ADD CONSTRAINT fk_shipment_order FOREIGN KEY(order_id) REFERENCES "order"(id);
          ALTER TABLE shipment ADD CONSTRAINT fk_shipment_supplier FOREIGN KEY(supplier_id) REFERENCES supplier(id);
        `,
      sqlite: `
        -- Create tables without foreign keys that reference "order"
        create table customer (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name text not null
        );

        create table product (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name text not null
        );

        create table supplier (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name text not null
        );

        -- Now create the order and shipment tables
        create table "order" (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          quantity integer not null
        );

        create table shipment (
          id INTEGER PRIMARY KEY AUTOINCREMENT
        );

        -- After all tables are created, add the foreign key constraints
        ALTER TABLE customer ADD COLUMN last_order_id integer  REFERENCES "order"(id);
        ALTER TABLE product ADD COLUMN first_order_id integer REFERENCES "order"(id);
        ALTER TABLE supplier ADD COLUMN first_shipment_id integer REFERENCES shipment(id);

        ALTER TABLE "order" ADD COLUMN customer_id integer not null REFERENCES customer(id);
        ALTER TABLE "order" ADD COLUMN product_id integer not null REFERENCES product(id);
        ALTER TABLE "order" ADD COLUMN shipment_id integer REFERENCES shipment(id);

        ALTER TABLE shipment ADD COLUMN order_id integer not null REFERENCES "order"(id);
        ALTER TABLE shipment ADD COLUMN supplier_id integer not null REFERENCES supplier(id);
        PRAGMA foreign_keys = ON;
        `,
    };
    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
          import { createSeedClient } from "#snaplet/seed"
          const seed = await createSeedClient()
          const ordersStore = await seed.orders([{
            quantity: 10,
            productsByFirstOrderId: {
              firstOrderId: 1,
              name: 'Gadget',
            },
            customersByLastOrderId: {
              lastOrderId: 1,
              name: 'John Doe'
            },
          }]);
          await seed.shipments([
            {
              suppliersByFirstShipmentId: {name: "GizmoCorp", firstShipmentId: 1},
            }
          ], {connect: ordersStore})
        `,
    });
    // Verify the circular dependencies
    const customerResult = await db.query(`SELECT * FROM customer`);
    const productResult = await db.query(`SELECT * FROM product`);
    const orderResult = await db.query(`SELECT * FROM "order"`);
    const shipmentResult = await db.query(`SELECT * FROM shipment`);
    const supplierResult = await db.query(`SELECT * FROM supplier`);

    // Assertions
    expect(customerResult).toEqual(
      expect.arrayContaining([
        {
          id: 1,
          name: "John Doe",
          last_order_id: 1,
        },
      ]),
    );

    expect(productResult).toEqual(
      expect.arrayContaining([
        {
          id: 1,
          name: "Gadget",
          first_order_id: 1,
        },
      ]),
    );

    expect(orderResult).toEqual(
      expect.arrayContaining([
        {
          id: 1,
          customer_id: 1,
          product_id: 1,
          quantity: 10,
          shipment_id: null,
        },
      ]),
    );

    expect(shipmentResult).toEqual(
      expect.arrayContaining([
        {
          id: 1,
          order_id: 1,
          supplier_id: 1,
        },
      ]),
    );

    expect(supplierResult).toEqual(
      expect.arrayContaining([
        {
          id: 1,
          name: "GizmoCorp",
          first_shipment_id: 1,
        },
      ]),
    );
  });

  test("should work with one single nullable FK table in the circular loop", async () => {
    const schema: DialectRecordWithDefault = {
      default: `
        create table customer (
          id serial primary key,
          name text not null,
          last_order_id integer NOT NULL
        );

        create table product (
          id serial primary key,
          name text not null,
          first_order_id integer NOT NULL
        );

        create table "order" (
          id serial primary key,
          customer_id integer,
          product_id integer,
          quantity integer not null,
          CONSTRAINT fk_customer
            FOREIGN KEY(customer_id)
            REFERENCES customer(id),
          CONSTRAINT fk_product
            FOREIGN KEY(product_id)
            REFERENCES product(id)
        );
        -- Add constraints to customer and product tables
        alter table customer add constraint fk_last_order
          foreign key (last_order_id) references "order"(id);

        alter table product add constraint fk_first_order
          foreign key (first_order_id) references "order"(id);
        `,
      sqlite: `
        create table customer (
          id integer primary key autoincrement,
          name text not null
        );

        create table product (
          id integer primary key autoincrement,
          name text not null
        );

        create table "order" (
          id integer primary key autoincrement,
          customer_id integer REFERENCES customer(id),
          product_id integer REFERENCES product(id),
          quantity integer not null
        );
        ALTER TABLE customer ADD COLUMN last_order_id integer not null REFERENCES "order"(id);
        ALTER TABLE product ADD COLUMN first_order_id integer not null REFERENCES "order"(id);
        PRAGMA foreign_keys = ON;
        `,
    };
    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
          import { createSeedClient } from "#snaplet/seed"
          const seed = await createSeedClient()
          await seed.customers([{name: "John Doe"}], {connect: true})
          await seed.products([{name: "Gadget"}], {connect: true})
          await seed.orders([{
            quantity: 10,
          }], {connect: true})
        `,
    });
    const customerResults = await db.query(
      `select * from customer order by id asc`,
    );
    const orderResults = await db.query(
      `select * from "order" order by id asc`,
    );
    const productResults = await db.query(
      `select * from product order by id asc`,
    );

    expect(customerResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          name: "John Doe",
          last_order_id: 1,
        }),
      ]),
    );

    expect(orderResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          customer_id: 1,
          product_id: 1,
          quantity: 10,
        }),
      ]),
    );

    expect(productResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 1,
          name: "Gadget",
          first_order_id: 1,
        }),
      ]),
    );
  });

  test("should handle join table relationship", async () => {
    const schema: DialectRecordWithDefault = {
      default: `
        CREATE TABLE authors (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL
        );

        CREATE TABLE books (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL
        );

        CREATE TABLE author_books (
          author_id INTEGER NOT NULL,
          book_id INTEGER NOT NULL,
          PRIMARY KEY (author_id, book_id),
          FOREIGN KEY (author_id) REFERENCES authors(id),
          FOREIGN KEY (book_id) REFERENCES books(id)
        );
        `,
      sqlite: `
        CREATE TABLE authors (
          id INTEGER NOT NULL PRIMARY KEY,
          name TEXT NOT NULL
        );

        CREATE TABLE books (
          id INTEGER NOT NULL PRIMARY KEY,
          title TEXT NOT NULL
        );

        CREATE TABLE author_books (
          author_id INTEGER NOT NULL,
          book_id INTEGER NOT NULL,
          PRIMARY KEY (author_id, book_id),
          FOREIGN KEY (author_id) REFERENCES authors(id),
          FOREIGN KEY (book_id) REFERENCES books(id)
        );
        PRAGMA foreign_keys = ON;
        `,
    };
    const { db } = await setupProject({
      adapter,
      databaseSchema: schema[dialect] ?? schema.default,
      seedScript: `
          import { createSeedClient } from "#snaplet/seed"
          const seed = await createSeedClient()
          await seed.authors([
            {
              name: "Author One",
              authorBooks: [{book: {id: 1, title: "Book One"}}, {book: {id: 2, title: "Book Two"}}]
            },
            {
              name: "Author Two",
              authorBooks: [{bookId: 1}]
            }
          ])
        `,
    });
    const results = await db.query(`
        SELECT a.name, b.title
        FROM author_books ab
        JOIN authors a ON ab.author_id = a.id
        JOIN books b ON ab.book_id = b.id
      `);

    // Assertions to verify the join table relationships
    // This assumes your testing framework has an expect function and that
    // you're familiar with its assertion syntax. Adjust accordingly.
    expect(results).toEqual(
      expect.arrayContaining([
        { name: "Author One", title: "Book One" },
        { name: "Author One", title: "Book Two" },
        { name: "Author Two", title: "Book One" },
      ]),
    );
  });

  test("should error on non nullables complex circular references", async () => {
    const schema: DialectRecordWithDefault = {
      default: `
        create table customer (
          id serial primary key,
          name text not null,
          last_order_id integer NOT NULL
        );

        create table product (
          id serial primary key,
          name text not null,
          first_order_id integer NOT NULL
        );

        create table "order" (
          id serial primary key,
          customer_id integer not null,
          product_id integer not null,
          quantity integer not null,
          CONSTRAINT fk_customer
            FOREIGN KEY(customer_id)
            REFERENCES customer(id),
          CONSTRAINT fk_product
            FOREIGN KEY(product_id)
            REFERENCES product(id)
        );
        -- Add constraints to customer and product tables
        alter table customer add constraint fk_last_order foreign key (last_order_id) references "order"(id);

        alter table product add constraint fk_first_order foreign key (first_order_id) references "order"(id);
        `,
      sqlite: `
        create table customer (
          id integer primary key autoincrement,
          name text not null
        );

        create table product (
          id integer primary key autoincrement,
          name text not null
        );

        create table "order" (
          id integer primary key autoincrement,
          customer_id integer not null REFERENCES customer(id),
          product_id integer not null REFERENCES product(id),
          quantity integer not null
        );
        ALTER TABLE customer ADD COLUMN last_order_id integer not null REFERENCES "order"(id);
        ALTER TABLE product ADD COLUMN first_order_id integer not null REFERENCES "order"(id);
        PRAGMA foreign_keys = ON;
        `,
    };
    await expect(() =>
      setupProject({
        adapter,
        databaseSchema: schema[dialect] ?? schema.default,
        seedScript: `
          import { createSeedClient } from "#snaplet/seed"
          const seed = await createSeedClient({dryRun: true})
          await seed.orders([
            {
              quantity: 10,
              productsByFirstOrderId: {
                name: "Gadget",
              },
              customersByLastOrderId: {
                name: "John Doe",
              }
            }
          ])
        `,
      }),
    ).rejects.toThrow("Maximum call stack size exceeded");
  });

  if (dialect === "postgres") {
    test("with single columns nullable with unique null not distinct set", async () => {
      const schema = `
          CREATE TABLE "Match" (
            "teamId" integer,
            "gameId" integer,
            "score" integer NOT NULL,
            UNIQUE NULLS NOT DISTINCT ("teamId")
          );
        `;

      const { db } = await setupProject({
        adapter,
        databaseSchema: schema,
        seedScript: `
          import { createSeedClient } from '#snaplet/seed'
          import {copycat} from '@snaplet/copycat'

          const seed = await createSeedClient({ dryRun: false })
          // There is maximum 2 possible combinations of nulls not distinct
          await seed.matches((x) => x(2,
            () => ({
              teamId: ({seed}) => copycat.oneOf(seed, [null, 1]),
            })
          ))
        `,
      });

      // Perform the queries and assertions
      const matches = await db.query<{
        gameId: null | number;
        score: number;
        teamId: null | number;
      }>('SELECT * FROM "Match" ORDER BY "score"');
      expect(matches.length).toEqual(2);

      expect(matches).toEqual(
        expect.arrayContaining([
          {
            teamId: 1,
            gameId: expect.any(Number),
            score: expect.any(Number),
          },
          {
            teamId: null,
            gameId: expect.any(Number),
            score: expect.any(Number),
          },
        ]),
      );
    });

    test("with single columns nullable with unique null not distinct set and too many error", async () => {
      const schema = `
          CREATE TABLE "Match" (
            "teamId" integer,
            "gameId" integer,
            "score" integer NOT NULL,
            UNIQUE NULLS NOT DISTINCT ("teamId")
          );
        `;

      await expect(() =>
        setupProject({
          adapter,
          databaseSchema: schema,
          seedScript: `
          import { createSeedClient } from '#snaplet/seed'
          import {copycat} from '@snaplet/copycat'

          const seed = await createSeedClient({ dryRun: false })
          // There is maximum 2 possible combinations of nulls not distinct this should fail
          await seed.matches((x) => x(3,
            () => ({
              teamId: ({seed}) => copycat.oneOf(seed, [null, 1]),
            })
          ))
        `,
        }),
      ).rejects.toThrow(
        `Unique constraint "Match_teamId_key" violated for model "matches" on fields (teamId)`,
      );
    });

    test("with multi columns nullable with unique null not distinct set", async () => {
      const schema = `
          CREATE TABLE "Match" (
            "teamId" integer,
            "gameId" integer,
            "score" integer NOT NULL,
            UNIQUE NULLS NOT DISTINCT ("teamId", "gameId")
          );
        `;

      const { db } = await setupProject({
        adapter,
        databaseSchema: schema,
        seedScript: `
          import { createSeedClient } from '#snaplet/seed'
          import {copycat} from '@snaplet/copycat'

          const seed = await createSeedClient({ dryRun: false })
          // There is maximum 4 possible combinations of nulls not distinct
          await seed.matches((x) => x(4,
            () => ({
              teamId: ({seed}) => copycat.oneOf(seed, [null, 1]),
              gameId: ({seed}) => copycat.oneOf(seed, [null, 1]),
            })
          ))
        `,
      });

      // Perform the queries and assertions
      const matches = await db.query<{
        gameId: null | number;
        score: number;
        teamId: null | number;
      }>('SELECT * FROM "Match" ORDER BY "score"');
      expect(matches.length).toEqual(4);

      expect(matches).toEqual([
        { teamId: null, gameId: null, score: expect.any(Number) },
        { teamId: 1, gameId: 1, score: expect.any(Number) },
        { teamId: 1, gameId: null, score: expect.any(Number) },
        { teamId: null, gameId: 1, score: expect.any(Number) },
      ]);
    });

    test("with multi columns nullable with unique null not distinct and too many error", async () => {
      const schema = `
          CREATE TABLE "Match" (
            "teamId" integer,
            "gameId" integer,
            "score" integer NOT NULL,
            UNIQUE NULLS NOT DISTINCT ("teamId", "gameId")
          );
        `;

      await expect(() =>
        setupProject({
          adapter,
          databaseSchema: schema,
          seedScript: `
          import { createSeedClient } from '#snaplet/seed'
          import {copycat} from '@snaplet/copycat'

          const seed = await createSeedClient({ dryRun: false })
          // There is maximum 4 possible combinations of nulls not distinct this should fail
          await seed.matches((x) => x(5,
            () => ({
              teamId: ({seed}) => copycat.oneOf(seed, [null, 1]),
              gameId: ({seed}) => copycat.oneOf(seed, [null, 1]),
            })
          ))
        `,
        }),
      ).rejects.toThrow(
        `Unique constraint "Match_teamId_gameId_key" violated for model "matches" on fields (gameId,teamId)`,
      );
    });

    test("with on multi FK null made by nullable unique index and nulls not distinct", async () => {
      const schema = `
          CREATE TABLE "Team" (
            "id" SERIAL PRIMARY KEY
          );
          CREATE TABLE "Player" (
            "id" BIGSERIAL PRIMARY KEY,
            "teamId" integer NOT NULL REFERENCES "Team"("id"),
            "name" text NOT NULL
          );
          CREATE TABLE "Game" (
            "id" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY
          );
          -- Original Match table allowing nullable composite keys
          CREATE TABLE "Match" (
            "teamId" integer REFERENCES "Team"("id"),
            "gameId" integer REFERENCES "Game"("id"),
            "score" integer NOT NULL,
            UNIQUE NULLS NOT DISTINCT ("teamId", "gameId")
          );
        `;

      const { db } = await setupProject({
        adapter,
        databaseSchema: schema,
        seedScript: `
          import { createSeedClient } from '#snaplet/seed'
          const seed = await createSeedClient({ dryRun: false })
          await seed.teams((x) => x(1, {
            players: (x) => x(1)
          }));
          await seed.games((x) => x(1));
          // There is only 4 possible combinations of nulls not distinct
          await seed.matches((x) => x(4), { connect: true });
        `,
      });

      // Perform the queries and assertions
      const teams = await db.query<{ id: number }>('SELECT * FROM "Team"');
      expect(teams.length).toEqual(1);
      const players = await db.query<{
        id: number;
        name: string;
        teamId: number;
      }>('SELECT * FROM "Player"');
      expect(players.length).toEqual(1);
      const games = await db.query<{ id: number }>('SELECT * FROM "Game"');
      // Expected to have no games inserted; adjust based on seed logic
      expect(games.length).toEqual(1);
      const matches = await db.query<{
        gameId: null | number;
        score: number;
        teamId: null | number;
      }>('SELECT * FROM "Match" ORDER BY "score"');
      expect(matches.length).toEqual(4);

      // Assertions for IDs and matches according to your test setup
      const teamIDs = teams
        .map((team) => Number(team.id))
        .sort((a, b) => a - b);
      const playerIDs = players
        .map((player) => Number(player.id))
        .sort((a, b) => a - b);
      expect(teamIDs).toEqual([1]);
      expect(playerIDs).toEqual([1]);

      // Only in postgres dialect it's possible for a table to have no primary key or UNIQUE NON NULLABLE index
      // on sqlite we'll always fallback on the table rowid and be able to do the connection
      // Matches will have null values for teamId and gameId due to the fact there is not PK on this table to perform subsequent UPDATE
      expect(matches).toEqual(
        expect.arrayContaining([
          { teamId: null, gameId: null, score: expect.any(Number) },
          { teamId: null, gameId: 1, score: expect.any(Number) },
          { teamId: 1, gameId: 1, score: expect.any(Number) },
          { teamId: 1, gameId: null, score: expect.any(Number) },
        ]),
      );
    });

    test("should multi FK fail the constraint if we ask for too many rows with nulls not distinct", async () => {
      const schema = `
          CREATE TABLE "Team" (
            "id" SERIAL PRIMARY KEY
          );
          CREATE TABLE "Player" (
            "id" BIGSERIAL PRIMARY KEY,
            "teamId" integer NOT NULL REFERENCES "Team"("id"),
            "name" text NOT NULL
          );
          CREATE TABLE "Game" (
            "id" INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY
          );
          -- Original Match table allowing nullable composite keys
          CREATE TABLE "Match" (
            "teamId" integer REFERENCES "Team"("id"),
            "gameId" integer REFERENCES "Game"("id"),
            "score" integer NOT NULL,
            UNIQUE NULLS NOT DISTINCT ("teamId", "gameId")
          );
        `;

      await expect(() =>
        setupProject({
          adapter,
          databaseSchema: schema,
          seedScript: `
        import { createSeedClient } from '#snaplet/seed'
        const seed = await createSeedClient({ dryRun: false })
        await seed.teams((x) => x(1, {
          players: (x) => x(1)
        }));
        await seed.games((x) => x(1));
        // There is only 4 possible combinations of nulls not distinct and we ask for 5, this should fail
        await seed.matches((x) => x(5), { connect: true });
      `,
        }),
      ).rejects.toThrow(
        `Unique constraint "Match_teamId_gameId_key" violated for model "matches" on fields (gameId,teamId)`,
      );
    });
  }

  // This should pass or fail at types analysis level
  _test.concurrent.todo(
    // eslint-disable-next-line vitest/valid-title
    computeName("should handle complex circular references using connection"),
    async () => {
      const schema: DialectRecordWithDefault = {
        default: `
            create table customer (
              id serial primary key,
              name text not null,
              last_order_id integer
            );

            create table product (
              id serial primary key,
              name text not null,
              first_order_id integer
            );

            create table "order" (
              id serial primary key,
              customer_id integer not null,
              product_id integer not null,
              quantity integer not null,
              CONSTRAINT fk_customer
                FOREIGN KEY(customer_id)
                REFERENCES customer(id),
              CONSTRAINT fk_product
                FOREIGN KEY(product_id)
                REFERENCES product(id)
            );
            -- Add constraints to customer and product tables
            alter table customer add constraint fk_last_order
              foreign key (last_order_id) references "order"(id);

            alter table product add constraint fk_first_order
              foreign key (first_order_id) references "order"(id);
        `,
        sqlite: `
        create table customer (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          last_order_id INTEGER,
          FOREIGN KEY(last_order_id) REFERENCES "order"(id)
        );
        create table product (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          first_order_id INTEGER,
          FOREIGN KEY(first_order_id) REFERENCES "order"(id)
        );
        create table "order" (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL,
          FOREIGN KEY(customer_id) REFERENCES customer(id),
          FOREIGN KEY(product_id) REFERENCES product(id)
        );
        PRAGMA foreign_keys = ON;
        `,
      };
      const { db } = await setupProject({
        adapter,
        databaseSchema: schema[dialect] ?? schema.default,
        seedScript: `
          import { createSeedClient } from "#snaplet/seed"
          const seed = await createSeedClient()
          // Create a new customer
          const customersStore = await seed.customers([
            { name: "John Doe" },
          ]);
          // Create an order and a product on this customer, set the first order id on the product
          // to match the order id
          await seed.orders([{
            quantity: 10,
            productsByFirstOrderId: {
              firstOrderId: (ctx) => ctx.$store.orders[0].id!,
              name: "Gadget",
            }
          }], { connect: customersStore });
        `,
      });
      const customerResults = await db.query(
        `select * from customer order by id asc`,
      );
      const orderResults = await db.query(
        `select * from "order" order by id asc`,
      );
      const productResults = await db.query(
        `select * from product order by id asc`,
      );
      expect(customerResults).toEqual(
        expect.arrayContaining([
          {
            id: 1,
            name: "John Doe",
            last_order_id: null,
          },
        ]),
      );

      expect(orderResults).toEqual(
        expect.arrayContaining([
          {
            id: 1,
            customer_id: 1,
            product_id: 1,
            quantity: 10,
          },
        ]),
      );

      expect(productResults).toEqual(
        expect.arrayContaining([
          {
            id: 1,
            name: "Gadget",
            first_order_id: 1,
          },
        ]),
      );
    },
  );
}
