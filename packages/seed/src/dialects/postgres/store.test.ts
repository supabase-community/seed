import { describe, expect, test } from "vitest";
import { type DatabaseClient } from "#core/adapters.js";
import { postgres } from "#test";
import { getDatamodel } from "./dataModel.js";
import { PgStore } from "./store.js";

const adapters = {
  postgresJs: () => postgres.postgresJs,
};

async function execQueries(client: DatabaseClient, queries: Array<string>) {
  for (const query of queries) {
    await client.run(query);
  }
}

describe.each(["postgresJs"] as const)("store: %s", (adapter) => {
  const { createTestDb } = adapters[adapter]();
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
      const orm = createDrizzleORMPostgresClient(drizzle(db.client));
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
      const dataModel = await getDatamodel(db.client);

      const store = new PgStore(dataModel);

      store.add("test_customer", {
        email: "cadavre@ex.quis",
      });

      store.add("test_customer", {
        name: "Winrar Skarsgård",
        email: "win@rar.gard",
      });
      await execQueries(db.client, [...store.toSQL()]);
      const results = await db.client.query(
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
      const dataModel = await getDatamodel(db.client);

      const store = new PgStore(dataModel);

      // For PostgreSQL, no need to explicitly set the ID for SERIAL columns in typical use cases
      store.add("test_customer", {
        email: "cadavre@ex.quis",
      });

      store.add("test_customer", {
        name: "Winrar Skarsgård",
        email: "win@rar.gard",
      });

      await execQueries(db.client, [...store.toSQL()]);
      const results = await db.client.query(
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
      const dataModel = await getDatamodel(db.client);

      const store = new PgStore(dataModel);

      store.add("test_customer", {
        email: "unknown@no.phone",
      });

      store.add("test_customer", {
        name: "Phoney McPhoneface",
        email: "phoney@mc.phone",
        phone: "+1234567890",
      });

      await execQueries(db.client, [...store.toSQL()]);
      const results = await db.client.query(
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
      const dataModel = await getDatamodel(db.client);

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

      await execQueries(db.client, [...store.toSQL()]);
      const results = await db.client.query(
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
  });
});
