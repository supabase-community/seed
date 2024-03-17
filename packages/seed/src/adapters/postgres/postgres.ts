import { type Sql } from "postgres";
import { DatabaseClient } from "#core/databaseClient.js";
import { type Adapter } from "../types.js";

export class PostgresClient extends DatabaseClient<Sql> {
  constructor(client: Sql) {
    super("postgres", client);
  }

  async disconnect(): Promise<void> {
    await this.client.end();
  }
  async query<K = object>(query: string): Promise<Array<K>> {
    const res = await this.client.unsafe(query);
    return res as unknown as Array<K>;
  }

  async run(query: string): Promise<void> {
    await this.client.unsafe(query);
  }
}

export const postgresAdapter = {
  id: "postgres" as const,
  className: "PostgresClient",
} satisfies Adapter;
