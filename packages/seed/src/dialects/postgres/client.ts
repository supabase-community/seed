import { EOL } from "node:os";
import { SeedClientBase } from "#core/client/client.js";
import { type SeedClientOptions } from "#core/client/types.js";
import { type DataModel } from "#core/dataModel/types.js";
import { type DatabaseClient } from "#core/databaseClient.js";
import { type Fingerprint } from "#core/fingerprint/types.js";
import { updateDataModelSequences } from "#core/sequences/updateDataModelSequences.js";
import { type UserModels } from "#core/userModels/types.js";
import { getDatabaseClient } from "#dialects/getDatabaseClient.js";
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
        emit: (event) => {
          console.error(event);
        },
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

    async $resetDatabase() {
      if (!this.dryRun) {
        const tablesToTruncate = Object.values(this.dataModel.models)
          .map(
            (model) =>
              // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
              `${escapeIdentifier(model.schemaName!)}.${escapeIdentifier(model.tableName)}`,
          )
          .join(", ");

        await this.db.execute(`TRUNCATE ${tablesToTruncate} CASCADE`);
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
    const databaseClient = options?.adapter ?? (await getDatabaseClient());
    const seed = new PgSeedClient(databaseClient, options);

    await seed.$syncDatabase();
    seed.$reset();

    return seed;
  };

  return createSeedClient;
}
