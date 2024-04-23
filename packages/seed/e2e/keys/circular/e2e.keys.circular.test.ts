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
