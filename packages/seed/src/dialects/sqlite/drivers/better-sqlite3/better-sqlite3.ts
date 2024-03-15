import { type Database } from "better-sqlite3";
import { z } from "zod";
import { DatabaseClient } from "#core/adapters.js";
import { type Driver } from "../../../types.js";
import { serializeParameters } from "../../../utils.js";

export class BetterSqlite3Client extends DatabaseClient<Database> {
  constructor(client: Database) {
    super("sqlite", client);
  }

  async disconnect(): Promise<void> {
    // no-op
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async query<K>(query: string): Promise<Array<K>> {
    const res = this.client.prepare(query).all();
    return res as Array<K>;
  }
  // eslint-disable-next-line @typescript-eslint/require-await
  async run(query: string): Promise<void> {
    this.client.prepare(query).all();
  }
}

const betterSqlite3ParametersSchema = z.tuple([
  z.string().describe("database file name"),
]);

export const betterSqlite3Schema = z.object({
  driver: z.literal("better-sqlite3"),
  parameters: betterSqlite3ParametersSchema,
});

type BetterSqlite3Parameters = z.infer<typeof betterSqlite3ParametersSchema>;

export const betterSqlite3Driver = {
  id: "better-sqlite3" as const,
  package: "better-sqlite3",
  definitelyTyped: "@types/better-sqlite3",
  parameters: betterSqlite3ParametersSchema,
  template: {
    import: `import Database from "better-sqlite3";`,
    create: (parameters: Array<unknown>) =>
      `new Database(${serializeParameters(parameters)})`,
  },
  async getDatabaseClient(...parameters: BetterSqlite3Parameters) {
    const Database = (await import("better-sqlite3")).default;
    const client = new Database(...parameters);
    return new BetterSqlite3Client(client);
  },
} satisfies Driver;
