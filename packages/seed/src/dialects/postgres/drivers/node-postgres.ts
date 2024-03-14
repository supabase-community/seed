import { type Client } from "pg";
import { DatabaseClient } from "#core/adapters.js";
import { postgresDatabaseUrlHint } from "./constants.js";

export class NodePostgresClient extends DatabaseClient<Client> {
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

export const nodePostgresDriver = {
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
    const { Client } = (await import("pg")).default;
    const client = new Client(options);
    return new NodePostgresClient(client);
  },
};
