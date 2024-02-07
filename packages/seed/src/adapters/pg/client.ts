import { getProjectConfig } from "@snaplet/config";
import { EOL } from "node:os";
import { Client, escapeIdentifier } from "pg";
import { SeedClientBase } from "#core/client/client.js";
import { type SeedClientBaseOptions } from "#core/client/types.js";
import { type DataModel } from "#core/dataModel/types.js";
import { type Fingerprint } from "#core/fingerprint/types.js";
import { type UserModels } from "#core/userModels/types.js";
import { Store } from "#dialects/postgres/store.js";
import { getDatamodel } from "./dataModel/dataModel.js";
import { updateDataModelSequences } from "./dataModel/updateDataModelSequences.js";

type SeedClientOptions = SeedClientBaseOptions & {
  client?: Client;
  dryRun?: boolean;
};

export type WithClient = (
  fn: (client: Client) => Promise<unknown>,
) => Promise<unknown>;

export function getSeedClient(props: {
  dataModel: DataModel;
  fingerprint: Fingerprint;
  userModels: UserModels;
}) {
  class SeedClient extends SeedClientBase {
    readonly dryRun: boolean;
    readonly options: SeedClientOptions;
    readonly withClient: WithClient;

    constructor(withClient: WithClient, options?: SeedClientOptions) {
      super({
        ...props,
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
        const tablesToTruncate = Object.values(this.dataModel.models)
          .map(
            (model) =>
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              `${escapeIdentifier(model.schemaName!)}.${escapeIdentifier(model.tableName)}`,
          )
          .join(", ");

        await this.withClient(async (client) => {
          await client.query(`TRUNCATE ${tablesToTruncate} CASCADE`);
        });
      }
    }

    async $syncDatabase(): Promise<void> {
      await this.withClient(async (client) => {
        const nextDataModel = await getDatamodel(client);
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

const withClientDefault: WithClient = async (fn) => {
  const connectionString = (await getProjectConfig()).targetDatabaseUrl;
  const client = new Client({ connectionString });
  await client.connect();

  try {
    await fn(client);
  } finally {
    await client.end();
  }
};
