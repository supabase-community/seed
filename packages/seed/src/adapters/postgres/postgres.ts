import { type Sql } from "postgres";
import { DatabaseClient } from "#core/databaseClient.js";
import { type Adapter } from "../types.js";

export class SeedPostgres extends DatabaseClient<Sql> {
  constructor(client: Sql) {
    super("postgres", client);
  }

  async disconnect(): Promise<void> {
    await this.client.end();
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
  id: "postgres" as const,
  className: "SeedPostgres",
} satisfies Adapter;
