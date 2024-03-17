import { type Sql } from "postgres";
import { z } from "zod";
import { DatabaseClient } from "#core/databaseClient.js";
import { type Adapter } from "../types.js";
import { serializeParameters } from "../utils.js";

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

const postgresParametersSchema = z.tuple([z.string().describe("database url")]);

type PostgresParameters = z.infer<typeof postgresParametersSchema>;

export const postgresSchema = z.object({
  adapter: z.literal("postgres"),
  parameters: postgresParametersSchema,
});

export const postgresAdapter = {
  id: "postgres" as const,
  template: {
    import: `import postgres from "postgres";`,
    create: (parameters: Array<unknown>) =>
      `postgres(${serializeParameters(parameters)})`,
  },
  package: "postgres",
  parameters: postgresParametersSchema,
  async getDatabaseClient(...parameters: PostgresParameters) {
    const postgres = (await import("postgres")).default;
    const client = postgres(...parameters);
    return new PostgresClient(client);
  },
} satisfies Adapter;
