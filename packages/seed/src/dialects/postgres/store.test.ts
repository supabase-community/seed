import { drizzle as drizzleJs } from "drizzle-orm/postgres-js";
import { describe, expect, test } from "vitest";
import { postgres } from "#test";
import {
  type DrizzleORMPgClient,
  createDrizzleORMPgClient,
} from "./adapters.js";
import { getDatamodel } from "./dataModel.js";
import { PgStore } from "./store.js";

const adapters = {
  postgresJs: () => ({
    ...postgres.postgresJs,
    drizzle: drizzleJs,
  }),
};

async function execQueries(client: DrizzleORMPgClient, queries: Array<string>) {
  for (const query of queries) {
    await client.run(query);
  }
}

describe.each(["postgresJs"] as const)("store: %s", (adapter) => {
  const { drizzle, createTestDb } = adapters[adapter]();
  describe("SQL -> Store -> SQL", () => {
    test("should be able to insert basic rows into table", async () => {
      const structure = `
      CREATE TABLE "test_customer" (
        id SERIAL PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL
      );
      `;
      const db = await createTestDb(structure);
      const orm = createDrizzleORMPgClient(drizzle(db.client));
      const dataModel = await getDatamodel(orm);

      const store = new PgStore(dataModel);

      store.add("test_customer", {
        id: "2",
        name: "Cadavre Exquis",
        email: "cadavre@ex.quis",
      });

      store.add("test_customer", {
        id: "3",
        name: "Winrar Skarsgård",
        email: "win@rar.gard",
      });
      await execQueries(orm, [...store.toSQL()]);
      const results = await orm.query(`SELECT * FROM test_customer`);
      expect(results).toEqual(
        expect.arrayContaining([
          { id: 2, name: "Cadavre Exquis", email: "cadavre@ex.quis" },
          { id: 3, name: "Winrar Skarsgård", email: "win@rar.gard" },
        ]),
      );
    });
    test("should insert into columns with default value set", async () => {
      const structure = `
      CREATE TABLE "test_customer" (
        id SERIAL PRIMARY KEY NOT NULL,
        name TEXT DEFAULT 'default_name' NOT NULL,
        email TEXT NOT NULL
      );
    `;
      const db = await createTestDb(structure);
      const orm = createDrizzleORMPgClient(drizzle(db.client));
      const dataModel = await getDatamodel(orm);

      const store = new PgStore(dataModel);

      store.add("test_customer", {
        email: "cadavre@ex.quis",
      });

      store.add("test_customer", {
        name: "Winrar Skarsgård",
        email: "win@rar.gard",
      });
      await execQueries(orm, [...store.toSQL()]);
      const results = await orm.query(
        `SELECT * FROM test_customer ORDER BY id ASC`,
      );
      expect(results).toEqual(
        expect.arrayContaining([
          { id: 1, name: "default_name", email: "cadavre@ex.quis" },
          { id: 2, name: "Winrar Skarsgård", email: "win@rar.gard" },
        ]),
      );
    });
    test("should insert into columns with generated column values", async () => {
      const structure = `
      CREATE TABLE "test_customer" (
        id SERIAL PRIMARY KEY NOT NULL,
        name TEXT DEFAULT 'default_name' NOT NULL,
        email TEXT NOT NULL,
        full_details TEXT GENERATED ALWAYS AS (name || ' <' || email || '>') STORED
      );
    `;
      const db = await createTestDb(structure);
      const orm = createDrizzleORMPgClient(drizzle(db.client));
      const dataModel = await getDatamodel(orm);

      const store = new PgStore(dataModel);

      // For PostgreSQL, no need to explicitly set the ID for SERIAL columns in typical use cases
      store.add("test_customer", {
        email: "cadavre@ex.quis",
      });

      store.add("test_customer", {
        name: "Winrar Skarsgård",
        email: "win@rar.gard",
      });

      await execQueries(orm, [...store.toSQL()]);
      const results = await orm.query(
        `SELECT * FROM test_customer ORDER BY id ASC`,
      );

      // Expect the generated full_details column to concatenate name and email as specified
      expect(results).toEqual(
        expect.arrayContaining([
          {
            id: 1, // Adjusted ID since SERIAL automatically increments
            name: "default_name",
            email: "cadavre@ex.quis",
            full_details: "default_name <cadavre@ex.quis>",
          },
          {
            id: 2, // Adjusted ID since SERIAL automatically increments
            name: "Winrar Skarsgård",
            email: "win@rar.gard",
            full_details: "Winrar Skarsgård <win@rar.gard>",
          },
        ]),
      );
    });
    test("should handle nullable column values correctly", async () => {
      const structure = `
      CREATE TABLE "test_customer" (
        id SERIAL PRIMARY KEY NOT NULL,
        name TEXT DEFAULT 'default_name' NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        full_details TEXT GENERATED ALWAYS AS (name || ' <' || email || '>' || ' Phone: ' || COALESCE(phone, 'N/A')) STORED
      );
    `;
      const db = await createTestDb(structure);
      const orm = createDrizzleORMPgClient(drizzle(db.client));
      const dataModel = await getDatamodel(orm);

      const store = new PgStore(dataModel);

      store.add("test_customer", {
        email: "unknown@no.phone",
      });

      store.add("test_customer", {
        name: "Phoney McPhoneface",
        email: "phoney@mc.phone",
        phone: "+1234567890",
      });

      await execQueries(orm, [...store.toSQL()]);
      const results = await orm.query(
        `SELECT * FROM test_customer ORDER BY id ASC`,
      );

      expect(results).toEqual(
        expect.arrayContaining([
          {
            id: 1, // Adjusted ID for SERIAL
            name: "default_name",
            email: "unknown@no.phone",
            phone: null,
            full_details: "default_name <unknown@no.phone> Phone: N/A",
          },
          {
            id: 2, // Adjusted ID for SERIAL
            name: "Phoney McPhoneface",
            email: "phoney@mc.phone",
            phone: "+1234567890",
            full_details:
              "Phoney McPhoneface <phoney@mc.phone> Phone: +1234567890",
          },
        ]),
      );
    });
    test("should handle relational data with nullable column values correctly in PostgreSQL", async () => {
      const structure = `
        CREATE TABLE test_customer (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL
        );

        CREATE TABLE test_order (
          id SERIAL PRIMARY KEY,
          customer_id INTEGER NOT NULL,
          product_name TEXT NOT NULL,
          quantity INTEGER DEFAULT 1 NOT NULL,
          FOREIGN KEY (customer_id) REFERENCES test_customer(id)
        );
      `;

      const db = await createTestDb(structure);
      const orm = createDrizzleORMPgClient(drizzle(db.client));
      const dataModel = await getDatamodel(orm);

      const store = new PgStore(dataModel);

      store.add("test_customer", {
        name: "John Doe",
        email: "john@doe.email",
      });
      store.add("test_customer", {
        name: "Jane Doe",
        email: "jane@doe.email",
      });

      const johnDoeId = 1;
      const janeDoeId = 2;

      store.add("test_order", {
        customer_id: johnDoeId,
        product_name: "Widget",
        quantity: 3,
      });
      store.add("test_order", {
        customer_id: janeDoeId,
        product_name: "Gadget",
      });

      await execQueries(orm, [...store.toSQL()]);
      const results = await orm.query(
        `SELECT test_customer.name, test_order.quantity FROM test_order JOIN test_customer ON test_customer.id = test_order.customer_id ORDER BY test_order.id ASC`,
      );

      expect(results).toEqual(
        expect.arrayContaining([
          {
            name: "John Doe",
            quantity: 3,
          },
          {
            name: "Jane Doe",
            quantity: 1,
          },
        ]),
      );
    });
    test("should handle auto circular references", async () => {
      const structure = `
        create table customer (
          id serial primary key,
          name text not null,
          referrer_id integer references customer(id)
        );
      `;

      const db = await createTestDb(structure);
      const orm = createDrizzleORMPgClient(drizzle(db.client));
      const dataModel = await getDatamodel(orm);

      const store = new PgStore(dataModel);

      store.add("customer", {
        id: 1,
        name: "John Doe",
        referrer_id: 2,
      });

      store.add("customer", {
        id: 2,
        name: "Jane Doe",
        referrer_id: 1,
      });

      await execQueries(orm, [...store.toSQL()]);
      const results = await orm.query(`select * from customer order by id asc`);

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
    test("should handle complex circular references", async () => {
      const structure = `
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
      `;

      const db = await createTestDb(structure);
      const orm = createDrizzleORMPgClient(drizzle(db.client));
      const dataModel = await getDatamodel(orm);

      const store = new PgStore(dataModel);

      // Assume IDs are auto-generated correctly and linked properly
      store.add("product", {
        id: 1,
        name: "Gadget",
        first_order_id: 1, // This will be updated later after creating the order
      });

      store.add("customer", {
        id: 1,
        name: "John Doe",
        last_order_id: 1, // This will be updated later after creating the order
      });

      store.add("order", {
        id: 1,
        customer_id: 1,
        product_id: 1,
        quantity: 10,
      });

      await execQueries(orm, [...store.toSQL()]);

      const customerResults = await orm.query(
        `select * from customer order by id asc`,
      );
      const orderResults = await orm.query(
        `select * from "order" order by id asc`,
      );
      const productResults = await orm.query(
        `select * from product order by id asc`,
      );

      expect(customerResults).toEqual(
        expect.arrayContaining([
          {
            id: 1,
            name: "John Doe",
            last_order_id: 1,
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
      const structure = `
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
      `;

      const db = await createTestDb(structure);
      const orm = createDrizzleORMPgClient(drizzle(db.client));
      const dataModel = await getDatamodel(orm);

      const store = new PgStore(dataModel);
      const customerId = 1;
      const productId = 1;
      const orderId = 1;
      const shipmentId = 1;
      const supplierId = 1;

      // Insert suppliers and products, which don't depend on the orders or shipments initially.
      store.add("supplier", {
        name: "GizmoCorp",
        first_shipment_id: shipmentId,
      });
      store.add("product", { name: "Gadget", first_order_id: orderId });

      // Insert a customer, which initially doesn't depend on an order.
      store.add("customer", { name: "John Doe", last_order_id: orderId });

      // Insert an order linking it to the customer and product, but without shipment_id.
      store.add("order", {
        customer_id: customerId,
        product_id: productId,
        quantity: 10,
        shipment_id: shipmentId,
      });

      // Insert a shipment linking it to the order and supplier.
      store.add("shipment", {
        order_id: orderId,
        supplier_id: supplierId,
      });

      await execQueries(orm, [...store.toSQL()]);

      // Verify the circular dependencies
      const customerResult = await orm.query(`SELECT * FROM customer`);
      const productResult = await orm.query(`SELECT * FROM product`);
      const orderResult = await orm.query(`SELECT * FROM "order"`);
      const shipmentResult = await orm.query(`SELECT * FROM shipment`);
      const supplierResult = await orm.query(`SELECT * FROM supplier`);

      // Assertions
      expect(customerResult).toEqual(
        expect.arrayContaining([
          {
            id: customerId,
            name: "John Doe",
            last_order_id: orderId,
          },
        ]),
      );

      expect(productResult).toEqual(
        expect.arrayContaining([
          {
            id: productId,
            name: "Gadget",
            first_order_id: orderId,
          },
        ]),
      );

      expect(orderResult).toEqual(
        expect.arrayContaining([
          {
            id: orderId,
            customer_id: customerId,
            product_id: productId,
            quantity: 10,
            shipment_id: shipmentId,
          },
        ]),
      );

      expect(shipmentResult).toEqual(
        expect.arrayContaining([
          {
            id: shipmentId,
            order_id: orderId,
            supplier_id: supplierId,
          },
        ]),
      );

      expect(supplierResult).toEqual(
        expect.arrayContaining([
          {
            id: supplierId,
            name: "GizmoCorp",
            first_shipment_id: shipmentId,
          },
        ]),
      );
    });
    test("should work with one single nullable FK table in the circular loop", async () => {
      const structure = `
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
      `;

      const db = await createTestDb(structure);
      const orm = createDrizzleORMPgClient(drizzle(db.client));
      const dataModel = await getDatamodel(orm);

      const store = new PgStore(dataModel);

      store.add("product", {
        id: 1,
        name: "Gadget",
        first_order_id: 1, // This will be updated later after creating the order
      });

      store.add("customer", {
        id: 1,
        name: "John Doe",
        last_order_id: 1, // This will be updated later after creating the order
      });

      store.add("order", {
        id: 1,
        customer_id: 1,
        product_id: 1,
        quantity: 10,
      });

      await execQueries(orm, [...store.toSQL()]);

      const customerResults = await orm.query(
        `select * from customer order by id asc`,
      );
      const orderResults = await orm.query(
        `select * from "order" order by id asc`,
      );
      const productResults = await orm.query(
        `select * from product order by id asc`,
      );

      expect(customerResults).toEqual(
        expect.arrayContaining([
          {
            id: 1,
            name: "John Doe",
            last_order_id: 1,
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
    test("should handle join table relationships", async () => {
      const structure = `
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
      `;

      const db = await createTestDb(structure);
      const orm = createDrizzleORMPgClient(drizzle(db.client));
      const dataModel = await getDatamodel(orm);

      const store = new PgStore(dataModel);

      const authorId1 = 1;
      const authorId2 = 2;
      const bookId1 = 1;
      const bookId2 = 2;
      // Insert authors
      store.add("authors", { name: "Author One" });
      store.add("authors", { name: "Author Two" });

      // Insert books
      store.add("books", { title: "Book One" });
      store.add("books", { title: "Book Two" });

      // Establish many-to-many relationships through author_books
      store.add("author_books", {
        author_id: authorId1,
        book_id: bookId1,
      });
      store.add("author_books", {
        author_id: authorId1,
        book_id: bookId2,
      });
      store.add("author_books", {
        author_id: authorId2,
        book_id: bookId1,
      });

      await execQueries(orm, [...store.toSQL()]);

      // Verify the relationships
      const results = await orm.query(`
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
      const structure = `
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
        alter table customer add constraint fk_last_order
          foreign key (last_order_id) references "order"(id);
    
        alter table product add constraint fk_first_order
          foreign key (first_order_id) references "order"(id);
      `;

      const db = await createTestDb(structure);
      const orm = createDrizzleORMPgClient(drizzle(db.client));
      const dataModel = await getDatamodel(orm);

      const store = new PgStore(dataModel);

      // Assume IDs are auto-generated correctly and linked properly
      store.add("product", {
        id: 1,
        name: "Gadget",
        first_order_id: 1,
      });

      store.add("customer", {
        id: 1,
        name: "John Doe",
        last_order_id: 1,
      });

      store.add("order", {
        id: 1,
        customer_id: 1,
        product_id: 1,
        quantity: 10,
      });

      expect(() => store.toSQL()).toThrowError(
        `Node order forms circular dependency: product -> order -> customer -> order`,
      );
    });
  });
});
