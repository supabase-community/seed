import { type Client } from "pg";
import { DatabaseClient } from "#core/databaseClient.js";
import { type Adapter } from "../types.js";

export class PgClient extends DatabaseClient<Client> {
  constructor(client: Client) {
    super("postgres", client);
  }

  async disconnect(): Promise<void> {
    await this.client.end();
  }
  async query<K = object>(query: string): Promise<Array<K>> {
    const { rows } = await this.client.query(query);
    return rows as Array<K>;
  }

  async run(query: string): Promise<void> {
    await this.client.query(query);
  }
}

export const pgAdapter = {
  id: "pg" as const,
  className: "PgClient",
} satisfies Adapter;
