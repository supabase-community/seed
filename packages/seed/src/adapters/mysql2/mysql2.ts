import dedent from "dedent";
import { type Connection, type Pool } from "mysql2/promise";
import { DatabaseClient } from "#core/databaseClient.js";
import { type Adapter } from "../types.js";

export class SeedMysql2 extends DatabaseClient<Connection | Pool> {
  constructor(client: Connection) {
    super("mysql", client);
  }

  async execute(query: string): Promise<void> {
    await this.client.query(query);
  }

  async query<K = object>(query: string): Promise<Array<K>> {
    const [results] = await this.client.query(query);
    return results as Array<K>;
  }
}

export const mysql2Adapter = {
  id: "mysql2" as const,
  name: "mysql2",
  packageName: "mysql2",
  template: (parameters = `/* connection string */`) => dedent`
    import { SeedMysql2 } from "@snaplet/seed/adapter-mysql2";
    import { defineConfig } from "@snaplet/seed/config";
    import { createConnection } from "mysql2/promise";

    export default defineConfig({
      adapter: async () => {
        const client = await createConnection(${parameters});
        await client.connect();
        return new SeedMysql2(client);
      },
    });
  `,
} satisfies Adapter;
