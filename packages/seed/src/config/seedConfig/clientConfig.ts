import { type DrizzleDbClient } from "#core/adapters.js";

type Parameter =
  | {
      hint?: string;
      kind: "scalar";
      name: string;
    }
  | { kind: "object"; name: string; properties: Record<string, Parameter> };

interface Driver {
  definitelyTyped?: string;
  getClient(parameters: unknown): Promise<DrizzleDbClient>;
  name: string;
  package: string;
  parameters: Array<Parameter>;
}

type Dialect = Array<Driver>;

type Dialects = Record<string, Dialect>;

const postgresDatabaseUrlHint =
  "postgres://[user]:[password]@[hostname]:[port]/[dbname]";

export const dialects: Dialects = {
  postgres: [
    {
      name: "Postgres.js",
      package: "postgres",
      parameters: [
        {
          kind: "scalar",
          name: "database url",
          hint: postgresDatabaseUrlHint,
        },
      ],
      async getClient(databaseUrl: string) {
        const { drizzle } = await import("drizzle-orm/postgres-js");
        const postgres = (await import("postgres")).default;
        const { createDrizzleORMPostgresClient: createDrizzleORMPgClient } =
          await import("#dialects/postgres/adapters.js");
        const client = postgres(databaseUrl);
        const db = drizzle(client);
        return createDrizzleORMPgClient(db);
      },
    },
    {
      name: "node-postgres",
      package: "pg",
      definitelyTyped: "@types/pg",
      parameters: [
        {
          name: "options",
          kind: "object",
          properties: {
            connectionString: {
              kind: "scalar",
              name: "connection string",
              hint: postgresDatabaseUrlHint,
            },
          },
        },
      ],
      async getClient(options: { connectionString: string }) {
        const { drizzle } = await import("drizzle-orm/node-postgres");
        const { Client } = (await import("pg")).default;
        const { createDrizzleORMPostgresClient: createDrizzleORMPgClient } =
          await import("#dialects/postgres/adapters.js");
        const client = new Client(options);
        const db = drizzle(client);
        return createDrizzleORMPgClient(db);
      },
    },
    {
      name: "Neon serverless HTTP",
      package: "@neondatabase/serverless",
      parameters: [
        {
          kind: "scalar",
          name: "database url",
          hint: postgresDatabaseUrlHint,
        },
      ],
      async getClient(databaseUrl: string) {
        const { drizzle } = await import("drizzle-orm/neon-http");
        const { neon } = await import("@neondatabase/serverless");
        const { createDrizzleORMPostgresClient: createDrizzleORMPgClient } =
          await import("#dialects/postgres/adapters.js");
        const client = neon(databaseUrl);
        const db = drizzle(client);
        return createDrizzleORMPgClient(db);
      },
    },
    {
      name: "Neon serverless WebSockets",
      package: "@neondatabase/serverless",
      parameters: [
        {
          name: "options",
          kind: "object",
          properties: {
            connectionString: {
              kind: "scalar",
              name: "connection string",
              hint: postgresDatabaseUrlHint,
            },
          },
        },
      ],
      async getClient(options: { connectionString: string }) {
        const { drizzle } = await import("drizzle-orm/neon-serverless");
        const { Client } = await import("@neondatabase/serverless");
        const { createDrizzleORMPostgresClient: createDrizzleORMPgClient } =
          await import("#dialects/postgres/adapters.js");
        const client = new Client(options);
        const db = drizzle(client);
        return createDrizzleORMPgClient(db);
      },
    },
  ],
};
