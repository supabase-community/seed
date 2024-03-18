import { type PgDatabase } from "drizzle-orm/pg-core";
import { EOL } from "node:os";
import { type DrizzleDbClient } from "#core/adapters.js";
import { SeedClientBase } from "#core/client/client.js";
import { type SeedClientOptions } from "#core/client/types.js";
import { filterModelsBySelectConfig } from "#core/client/utils.js";
import { type DataModel } from "#core/dataModel/types.js";
import { type Fingerprint } from "#core/fingerprint/types.js";
import { updateDataModelSequences } from "#core/sequences/updateDataModelSequences.js";
import { type UserModels } from "#core/userModels/types.js";
import { runtimeTelemetry } from "#runtime/runtimeTelemetry.js";
import { createDrizzleORMPgClient } from "./adapters.js";
import { getDatamodel } from "./dataModel.js";
import { PgStore } from "./store.js";
import { escapeIdentifier } from "./utils.js";

export function getSeedClient(props: {
  dataModel: DataModel;
  fingerprint: Fingerprint;
  userModels: UserModels;
}) {
  class PgSeedClient extends SeedClientBase {
    readonly db: DrizzleDbClient;
    readonly dryRun: boolean;
    readonly options?: SeedClientOptions;

    constructor(db: DrizzleDbClient, options?: SeedClientOptions) {
      super({
        ...props,
        createStore: (dataModel: DataModel) => new PgStore(dataModel),
        emit: (event) => {
          void runtimeTelemetry.captureThrottledEvent(event, {
            dialect: "postgres",
          });
        },
        runStatements: async (statements: Array<string>) => {
          if (!this.dryRun) {
            await this.db.run(statements.join(";"));
          } else {
            console.log(statements.join(`;${EOL}`) + ";");
          }
        },
        options,
      });

      this.dryRun = options?.dryRun ?? false;

      this.db = db;
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
          await this.db.run(`TRUNCATE ${tablesToTruncate} CASCADE`);
        }
      }
    }

    async $syncDatabase(): Promise<void> {
      // TODO: fix this, it's a hack
      const nextDataModel = await getDatamodel(this.db);
      this.dataModel = updateDataModelSequences(this.dataModel, nextDataModel);
    }

    async $transaction(cb: (seed: PgSeedClient) => Promise<void>) {
      await cb(await createSeedClient(this.db.adapter, this.options));
    }
  }

  const createSeedClient = async (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    db: PgDatabase<any>,
    options?: SeedClientOptions,
  ) => {
    const client = createDrizzleORMPgClient(db);
    const seed = new PgSeedClient(client, options);

    await seed.$syncDatabase();
    seed.$reset();

    return seed;
  };

  return createSeedClient;
}
