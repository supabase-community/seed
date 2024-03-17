import { type Client } from "pg";
import { z } from "zod";
import { DatabaseClient } from "#core/databaseClient.js";
import { type Adapter } from "../types.js";
import { serializeParameters } from "../utils.js";

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

const pgParametersSchema = z.tuple([
  z
    .object({
      connectionString: z.string().describe("connection string"),
    })
    .describe("options"),
]);

type PgParameters = z.infer<typeof pgParametersSchema>;

export const pgSchema = z.object({
  adapter: z.literal("pg"),
  parameters: pgParametersSchema,
});

export const pgAdapter = {
  id: "pg" as const,
  package: "pg",
  definitelyTyped: "@types/pg",
  template: {
    import: `import { Client } from "pg";`,
    create: (parameters: Array<unknown>) =>
      `new Client(${serializeParameters(parameters)})`,
  },
  parameters: pgParametersSchema,
  async getDatabaseClient(...parameters: PgParameters) {
    const { Client } = (await import("pg")).default;
    const client = new Client(...parameters);
    await client.connect();
    return new PgClient(client);
  },
} satisfies Adapter;
