import { EOL } from "node:os";
import { getDatabaseClient } from "#adapters/getDatabaseClient.js";
import { SeedClientBase, setupClient } from "#core/client/client.js";
import { type SeedClientOptions } from "#core/client/types.js";
import { filterModelsBySelectConfig } from "#core/client/utils.js";
import { type DataModel } from "#core/dataModel/types.js";
import { type DatabaseClient } from "#core/databaseClient.js";
import { type Fingerprint } from "#core/fingerprint/types.js";
import { updateDataModelSequences } from "#core/sequences/updateDataModelSequences.js";
import { type UserModels } from "#core/userModels/types.js";
import { getDatamodel } from "./dataModel.js";
import { PgStore } from "./store.js";
import { escapeIdentifier } from "./utils.js";

export function getSeedClient(props: {
  dataModel: DataModel;
  fingerprint: Fingerprint;
  userModels: UserModels;
}) {
  class PgSeedClient extends SeedClientBase {
    readonly db: DatabaseClient;
    readonly dryRun: boolean;
    readonly options?: SeedClientOptions;

    constructor(databaseClient: DatabaseClient, options?: SeedClientOptions) {
      super({
        ...props,
        createStore: (dataModel: DataModel) => new PgStore(dataModel),
        runStatements: async (statements: Array<string>) => {
          if (!this.dryRun) {
            await this.db.execute(statements.join(";"));
          } else {
            console.log(statements.join(`;${EOL}`) + ";");
          }
        },
        options,
      });

      this.dryRun = options?.dryRun ?? false;

      this.db = databaseClient;
      this.options = options;
    }

    async $resetDatabase(selectConfig?: Record<string, boolean>) {
      const models = Object.values(this.dataModel.models);
      const filteredModels = filterModelsBySelectConfig(models, selectConfig);
      if (!this.dryRun) {
        const tablesToTruncate = filteredModels
          .map(
            (model) =>
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              `${escapeIdentifier(model.schemaName!)}.${escapeIdentifier(model.tableName)}`,
          )
          .join(", ");
        if (tablesToTruncate.length > 0) {
          await this.db.execute(`TRUNCATE ${tablesToTruncate} CASCADE`);
        }
      }
    }

    async $syncDatabase(): Promise<void> {
      // TODO: fix this, it's a hack
      const nextDataModel = await getDatamodel(this.db);
      this.dataModel = updateDataModelSequences(this.dataModel, nextDataModel);
    }

    async $transaction(cb: (seed: PgSeedClient) => Promise<void>) {
      await cb(await createSeedClient(this.options));
    }
  }

  const createSeedClient = async (options?: SeedClientOptions) => {
    return setupClient({
      dialect: "postgres",
      async createClient() {
        const databaseClient = options?.adapter ?? (await getDatabaseClient());
        return new PgSeedClient(databaseClient, options);
      },
    });
  };

  return createSeedClient;
}
