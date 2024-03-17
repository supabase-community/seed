import { type Client } from "pg";
import { DatabaseClient } from "#core/databaseClient.js";
import { type Adapter } from "../types.js";

export class SeedPg extends DatabaseClient<Client> {
  constructor(client: Client) {
    super("postgres", client);
  }

  async disconnect(): Promise<void> {
    await this.client.end();
  }
  async execute(query: string): Promise<void> {
    await this.client.query(query);
  }

  async query<K = object>(query: string): Promise<Array<K>> {
    const { rows } = await this.client.query(query);
    return rows as Array<K>;
  }
}

export const pgAdapter = {
  id: "pg" as const,
  className: "SeedPg",
} satisfies Adapter;
