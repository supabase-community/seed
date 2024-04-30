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
      `,
      mysql: `
        CREATE TABLE customer (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          last_order_id INT,
          INDEX idx_last_order_id (last_order_id)
        );
        
        CREATE TABLE product (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          first_order_id INT,
          INDEX idx_first_order_id (first_order_id)
        );
        
        CREATE TABLE supplier (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          first_shipment_id INT,
          INDEX idx_first_shipment_id (first_shipment_id)
        );
        
        CREATE TABLE \`order\` (
          id INT AUTO_INCREMENT PRIMARY KEY,
          customer_id INT NOT NULL,
          product_id INT NOT NULL,
          quantity INT NOT NULL,
          shipment_id INT,
          INDEX idx_customer_id (customer_id),
          INDEX idx_product_id (product_id),
          INDEX idx_shipment_id (shipment_id)
        );
        
        CREATE TABLE shipment (
          id INT AUTO_INCREMENT PRIMARY KEY,
          order_id INT NOT NULL,
          supplier_id INT NOT NULL,
          INDEX idx_order_id (order_id),
          INDEX idx_supplier_id (supplier_id)
        );
        
        ALTER TABLE customer ADD CONSTRAINT fk_customer_last_order FOREIGN KEY (last_order_id) REFERENCES \`order\` (id);
        ALTER TABLE product ADD CONSTRAINT fk_product_first_order FOREIGN KEY (first_order_id) REFERENCES \`order\` (id);
        ALTER TABLE supplier ADD CONSTRAINT fk_supplier_first_shipment FOREIGN KEY (first_shipment_id) REFERENCES shipment (id);
        
        ALTER TABLE \`order\` ADD CONSTRAINT fk_order_customer FOREIGN KEY (customer_id) REFERENCES customer (id);
        ALTER TABLE \`order\` ADD CONSTRAINT fk_order_product FOREIGN KEY (product_id) REFERENCES product (id);
        ALTER TABLE \`order\` ADD CONSTRAINT fk_order_shipment FOREIGN KEY (shipment_id) REFERENCES shipment (id);
        
        ALTER TABLE shipment ADD CONSTRAINT fk_shipment_order FOREIGN KEY (order_id) REFERENCES \`order\` (id);
        ALTER TABLE shipment ADD CONSTRAINT fk_shipment_supplier FOREIGN KEY (supplier_id) REFERENCES supplier (id);
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
    const orderResult = await db.query(
      `SELECT * FROM ${adapter.escapeIdentifier("order")}`,
    );
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
      `,
      mysql: `
        CREATE TABLE customer (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          last_order_id INT NOT NULL,
          INDEX idx_last_order_id (last_order_id)
        );
        
        CREATE TABLE product (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          first_order_id INT NOT NULL,
          INDEX idx_first_order_id (first_order_id)
        );
        
        CREATE TABLE \`order\` (
          id INT AUTO_INCREMENT PRIMARY KEY,
          customer_id INT,
          product_id INT,
          quantity INT NOT NULL,
          INDEX idx_customer_id (customer_id),
          INDEX idx_product_id (product_id)
        );
        
        ALTER TABLE customer ADD CONSTRAINT fk_customer_last_order FOREIGN KEY (last_order_id) REFERENCES \`order\` (id);
        ALTER TABLE product ADD CONSTRAINT fk_product_first_order FOREIGN KEY (first_order_id) REFERENCES \`order\` (id);
        
        ALTER TABLE \`order\` ADD CONSTRAINT fk_order_customer FOREIGN KEY (customer_id) REFERENCES customer (id);
        ALTER TABLE \`order\` ADD CONSTRAINT fk_order_product FOREIGN KEY (product_id) REFERENCES product (id);      
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
      `select * from ${adapter.escapeIdentifier("order")} order by id asc`,
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
        
        `,
      mysql: `
          CREATE TABLE customer (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            last_order_id INT NOT NULL,
            INDEX idx_last_order_id (last_order_id)
          );
          
          CREATE TABLE product (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            first_order_id INT NOT NULL,
            INDEX idx_first_order_id (first_order_id)
          );
          
          CREATE TABLE \`order\` (
            id INT AUTO_INCREMENT PRIMARY KEY,
            customer_id INT NOT NULL,
            product_id INT NOT NULL,
            quantity INT NOT NULL,
            INDEX idx_customer_id (customer_id),
            INDEX idx_product_id (product_id)
          );
          
          ALTER TABLE customer ADD CONSTRAINT fk_customer_last_order FOREIGN KEY (last_order_id) REFERENCES \`order\` (id);
          ALTER TABLE product ADD CONSTRAINT fk_product_first_order FOREIGN KEY (first_order_id) REFERENCES \`order\` (id);
          
          ALTER TABLE \`order\` ADD CONSTRAINT fk_order_customer FOREIGN KEY (customer_id) REFERENCES customer (id);
          ALTER TABLE \`order\` ADD CONSTRAINT fk_order_product FOREIGN KEY (product_id) REFERENCES product (id);
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
