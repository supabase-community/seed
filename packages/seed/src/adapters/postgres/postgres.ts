import dedent from "dedent";
import { type Sql } from "postgres";
import { DatabaseClient } from "#core/databaseClient.js";
import { type Adapter } from "../types.js";

export class SeedPostgres extends DatabaseClient<Sql> {
  constructor(client: Sql) {
    super("postgres", client);
  }

  async execute(query: string): Promise<void> {
    await this.client.unsafe(query);
  }

  async query<K = object>(query: string): Promise<Array<K>> {
    const res = await this.client.unsafe(query);
    return res as unknown as Array<K>;
  }
}

export const postgresAdapter = {
  getDialect: () => "postgres",
  id: "postgres" as const,
  name: "Postgres.js",
  packageName: "postgres",
  template: (parameters = `/* connection parameters */`) => dedent`
    import { SeedPostgres } from "@snaplet/seed/adapter-postgres";
    import { defineConfig } from "@snaplet/seed/config";
    import postgres from "postgres";

    export default defineConfig({
      adapter: () => {
        const client = postgres(${parameters});
        return new SeedPostgres(client);
      },
    });
  `,
} satisfies Adapter;
