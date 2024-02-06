import { getProjectConfig } from "@snaplet/config";
import { EOL } from "node:os";
import { Client } from "pg";
import { SeedClientBase } from "#core/client/client.js";
import { type SeedClientBaseOptions } from "#core/client/types.js";
import { type DataModel } from "#core/dataModel/types.js";
import { type UserModels } from "#core/userModels/types.js";
import { Store } from "./store.js";

export type SeedClientOptions = SeedClientBaseOptions & {
  client?: Client;
  dryRun?: boolean;
};

export type WithClient = (
  fn: (client: Client) => Promise<unknown>,
) => Promise<unknown>;

export function getSeedClient(dataModel: DataModel, userModels: UserModels) {
  class SeedClient extends SeedClientBase {
    readonly dryRun: boolean;
    readonly options: SeedClientOptions;
    readonly withClient: WithClient;

    constructor(withClient: WithClient, options?: SeedClientOptions) {
      super({
        dataModel,
        userModels,
        createStore: (dataModel: DataModel) => new Store(dataModel),
        emit: (event) => {
          console.log(event);
        },
        runStatements: async (statements: Array<string>) => {
          if (!this.dryRun) {
            await withClient((client) => client.query(statements.join(";")));
          } else {
            console.log(statements.join(`;${EOL}`) + ";");
          }
        },
        options,
      });

      this.dryRun = options?.dryRun ?? false;
      this.options = options ?? {};
      this.withClient = withClient;
    }

    async $resetDatabase() {
      if (!this.dryRun) {
        // We extract the list of tables to truncate from the data model.
        // Since the dataModel generation is driven by the snaplet.config.ts select field
        // this will ensure that we only truncate tables that are selected and available to the
        // dataModel / seed SeedClient
        const tablesToTruncate = Object.values(this.dataModel.models)
          .filter((model) => Boolean(model.schemaName))
          .map((model) => ({
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            schema: model.schemaName!,
            table: model.tableName,
          }));

        await this.withClient((client) =>
          truncateTables(client, tablesToTruncate),
        );
      }
    }

    async $syncDatabase(): Promise<void> {
      await this.withClient(async (client) => {
        const nextDataModel = await fetchDataModel(client);
        this.dataModel = updateDataModelSequences(
          this.dataModel,
          nextDataModel,
        );
      });
    }

    async $transaction(cb: (seed: SeedClient) => Promise<void>) {
      await cb(await createSeedClient(this.options));
    }
  }

  const createSeedClient = async (options?: SeedClientOptions) => {
    let withClient: WithClient = withClientDefault;

    if (options?.client) {
      const { client } = options;
      withClient = async (fn: (client: Client) => Promise<unknown>) =>
        fn(client);
    }

    const seed = new SeedClient(withClient, options);

    await seed.$syncDatabase();
    seed.$reset();

    return seed;
  };

  return createSeedClient;
}

export const withClientDefault: WithClient = async (fn) => {
  const connectionString = (await getProjectConfig()).targetDatabaseUrl;
  const client = new Client({ connectionString });
  await client.connect();

  try {
    await fn(client);
  } finally {
    await client.end();
  }
};
