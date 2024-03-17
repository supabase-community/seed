import { DatabaseClient } from "#core/databaseClient.js";
import { type Adapter } from "../types.js";

interface PrismaLikeClient {
  $disconnect: () => Promise<void>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $executeRawUnsafe(query: string, ...values: Array<any>): Promise<number>;
  $queryRawUnsafe<T = unknown>(
    query: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...values: Array<any>
  ): Promise<T>;
}

export class SeedPrisma extends DatabaseClient<PrismaLikeClient> {
  constructor(client: PrismaLikeClient) {
    // TODO: determine the dialect from prisma client
    super("postgres", client);
  }

  async disconnect(): Promise<void> {
    await this.client.$disconnect();
  }
  async execute(query: string): Promise<void> {
    await this.client.$executeRawUnsafe(query);
  }

  async query<K = unknown>(query: string): Promise<Array<K>> {
    const res = await this.client.$queryRawUnsafe<K>(query);
    return res as Array<K>;
  }
}

export const postgresAdapter = {
  id: "postgres" as const,
  className: "SeedPostgres",
} satisfies Adapter;
