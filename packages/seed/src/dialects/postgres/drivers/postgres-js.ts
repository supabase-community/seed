import { type Sql } from "postgres";
import { DatabaseClient } from "#core/adapters.js";
import { postgresDatabaseUrlHint } from "./constants.js";
import { type Driver } from "./types.js";

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

export const postgresJsDriver: Driver = {
  name: "Postgres.js",
  package: "postgres",
  parameters: [
    {
      kind: "scalar",
      name: "database url",
      hint: postgresDatabaseUrlHint,
    },
  ],
  async getClient(databaseUrl: string) {
    const postgres = (await import("postgres")).default;
    const client = postgres(databaseUrl);
    return new PostgresJsClient(client);
  },
};
