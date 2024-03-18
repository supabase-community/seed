import { type BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import { EOL } from "node:os";
import { type DrizzleDbClient } from "#core/adapters.js";
import { SeedClientBase } from "#core/client/client.js";
import { type SeedClientOptions } from "#core/client/types.js";
import { type DataModel } from "#core/dataModel/types.js";
import { type Fingerprint } from "#core/fingerprint/types.js";
import { updateDataModelSequences } from "#core/sequences/updateDataModelSequences.js";
import { type UserModels } from "#core/userModels/types.js";
import { runtimeTelemetry } from "#runtime/runtimeTelemetry.js";
import { createDrizzleORMSqliteClient } from "./adapters.js";
import { getDatamodel } from "./dataModel.js";
import { SqliteStore } from "./store.js";
import { escapeIdentifier } from "./utils.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DrizzleSqliteDatabase = BaseSQLiteDatabase<any, unknown>;

export function getSeedClient(props: {
  dataModel: DataModel;
  fingerprint: Fingerprint;
  userModels: UserModels;
}) {
  class SqliteSeedClient extends SeedClientBase {
    readonly db: DrizzleDbClient;
    readonly dryRun: boolean;
    readonly options?: SeedClientOptions;

    constructor(db: DrizzleDbClient, options?: SeedClientOptions) {
      super({
        ...props,
        createStore: (dataModel: DataModel) => new SqliteStore(dataModel),
        emit: (event) => {
          void runtimeTelemetry.captureThrottledEvent(event, {
            dialect: "sqlite",
          });
        },
        runStatements: async (statements: Array<string>) => {
          if (!this.dryRun) {
            for (const statement of statements) {
              await this.db.run(statement);
            }
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

    async $resetDatabase() {
      if (!this.dryRun) {
        const tablesToTruncate = Object.values(this.dataModel.models).map(
          (model) => escapeIdentifier(model.tableName),
        );
        for (const table of tablesToTruncate) {
          await this.db.run(`DELETE FROM ${table}`);
        }
      }
    }

    async $syncDatabase(): Promise<void> {
      // TODO: fix this, it's a hack
      const nextDataModel = await getDatamodel(this.db);
      this.dataModel = updateDataModelSequences(this.dataModel, nextDataModel);
    }

    async $transaction(cb: (seed: SqliteSeedClient) => Promise<void>) {
      await cb(await createSeedClient(this.db.adapter, this.options));
    }
  }

  const createSeedClient = async (
    db: DrizzleSqliteDatabase,
    options?: SeedClientOptions,
  ) => {
    const client = createDrizzleORMSqliteClient(db);
    const seed = new SqliteSeedClient(client, options);

    await seed.$syncDatabase();
    seed.$reset();

    return seed;
  };

  return createSeedClient;
}
