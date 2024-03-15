import { type Sql } from "postgres";
import { z } from "zod";
import { DatabaseClient } from "#core/adapters.js";
import { type Driver } from "../../types.js";
import { serializeParameters } from "../../utils.js";

export class PostgresJsClient extends DatabaseClient<Sql> {
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

const postgresJsParametersSchema = z.tuple([
  z.string().describe("database url"),
]);

export const postgresJsSchema = z.object({
  driver: z.literal("postgres-js"),
  parameters: postgresJsParametersSchema,
});

export const postgresJsDriver = {
  id: "postgres-js" as const,
  template: {
    import: `import postgres from "postgres";`,
    create: (parameters: Array<unknown>) =>
      `postgres(${serializeParameters(parameters)})`,
  },
  package: "postgres",
  parameters: postgresJsParametersSchema,
  async getDatabaseClient(databaseUrl: string) {
    const postgres = (await import("postgres")).default;
    const client = postgres(databaseUrl);
    return new PostgresJsClient(client);
  },
} satisfies Driver;
