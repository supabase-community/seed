import { type Client } from "pg";
import { z } from "zod";
import { DatabaseClient } from "#core/adapters.js";
import { type DriverItem } from "../../types.js";

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

const nodePostgresParametersSchema = z.tuple([
  z
    .object({
      connectionString: z.string().describe("connection string"),
    })
    .describe("options"),
]);

export const nodePostgresSchema = z.object({
  driver: z.literal("node-postgres"),
  parameters: nodePostgresParametersSchema,
});

export const nodePostgresDriver = {
  name: "node-postgres" as const,
  package: "pg",
  definitelyTyped: "@types/pg",
  parameters: nodePostgresParametersSchema,
  async getDatabaseClient(options: { connectionString: string }) {
    const { Client } = (await import("pg")).default;
    const client = new Client(options);
    return new NodePostgresClient(client);
  },
} satisfies DriverItem;
