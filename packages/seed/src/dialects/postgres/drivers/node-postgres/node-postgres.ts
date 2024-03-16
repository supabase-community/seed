import { type Client } from "pg";
import { z } from "zod";
import { DatabaseClient } from "#core/databaseClient.js";
import { type Driver } from "../../../types.js";
import { serializeParameters } from "../../../utils.js";

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

type NodePostgresParameters = z.infer<typeof nodePostgresParametersSchema>;

export const nodePostgresSchema = z.object({
  driver: z.literal("node-postgres"),
  parameters: nodePostgresParametersSchema,
});

export const nodePostgresDriver = {
  id: "node-postgres" as const,
  package: "pg",
  definitelyTyped: "@types/pg",
  template: {
    import: `import { Client } from "pg";`,
    create: (parameters: Array<unknown>) =>
      `new Client(${serializeParameters(parameters)})`,
  },
  parameters: nodePostgresParametersSchema,
  async getDatabaseClient(...parameters: NodePostgresParameters) {
    const { Client } = (await import("pg")).default;
    const client = new Client(...parameters);
    await client.connect();
    return new NodePostgresClient(client);
  },
} satisfies Driver;
