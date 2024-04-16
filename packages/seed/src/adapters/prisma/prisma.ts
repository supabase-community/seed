import dedent from "dedent";
import { type DataModel } from "#core/dataModel/types.js";
import { DatabaseClient } from "#core/databaseClient.js";
import { type UserModels } from "#core/userModels/types.js";
import { type Adapter } from "../types.js";
import { patchSqliteUserModels } from "./patchUserModels.js";

interface PrismaLikeClient {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  $executeRawUnsafe(query: string, ...values: Array<any>): Promise<number>;
  $queryRawUnsafe<T = unknown>(
    query: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...values: Array<any>
  ): Promise<T>;
  // https://github.com/prisma/prisma/blob/ed2f2fc22c5847839b8fd742192fa3b4ad5e78d6/packages/client/src/runtime/getPrismaClient.ts#L404
  _engineConfig?: {
    // https://github.com/prisma/prisma/blob/ed2f2fc22c5847839b8fd742192fa3b4ad5e78d6/packages/client/tests/functional/_utils/providers.ts#L1-L8
    activeProvider:
      | "cockroachdb"
      | "mongodb"
      | "mysql"
      | "postgresql"
      | "sqlite"
      | "sqlserver";
  };
}

export class SeedPrisma extends DatabaseClient<PrismaLikeClient> {
  constructor(client: PrismaLikeClient) {
    switch (client._engineConfig?.activeProvider) {
      case "postgresql":
        super("postgres", client);
        break;
      case "sqlite":
        super("sqlite", client);
        break;
      case "mysql":
        super("mysql", client);
        break;
      default:
        throw new Error(
          `Unsupported Prisma provider ${client._engineConfig?.activeProvider}`,
        );
    }
  }

  override adapterPatchUserModels(props: {
    dataModel: DataModel;
    userModels: UserModels;
  }) {
    if (this.dialect === "sqlite") {
      return patchSqliteUserModels(props.dataModel, props.userModels);
    }
    return props.userModels;
  }

  async execute(query: string): Promise<void> {
    await this.client.$executeRawUnsafe(query);
  }

  async query<K = object>(query: string): Promise<Array<K>> {
    const res = await this.client.$queryRawUnsafe<K>(query);
    return res as Array<K>;
  }
}

export const prismaAdapter = {
  id: "prisma" as const,
  name: "Prisma",
  packageName: "@prisma/client",
  template: (parameters = `/* connection parameters */`) => dedent`
    import { SeedPrisma } from "@snaplet/seed/adapter-prisma";
    import { defineConfig } from "@snaplet/seed/config";
    import { PrismaClient } from "@prisma/client";

    export default defineConfig({
      adapter: () => {
        const client = new PrismaClient(${parameters});
        return new SeedPrisma(client);
      },
      select: ["!*_prisma_migrations"],
    });
  `,
} satisfies Adapter;
