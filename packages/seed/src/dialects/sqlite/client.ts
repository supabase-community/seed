import { sql } from "drizzle-orm";
import { type BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import { EOL } from "node:os";
import { SeedClientBase } from "#core/client/client.js";
import { type SeedClientOptions } from "#core/client/types.js";
import { type DataModel } from "#core/dataModel/types.js";
import { type Fingerprint } from "#core/fingerprint/types.js";
import { updateDataModelSequences } from "#core/sequences/updateDataModelSequences.js";
import { type UserModels } from "#core/userModels/types.js";
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
  class PgSeedClient extends SeedClientBase {
    readonly db: DrizzleSqliteDatabase;
    readonly dryRun: boolean;
    readonly options?: SeedClientOptions;

    constructor(db: DrizzleSqliteDatabase, options?: SeedClientOptions) {
      super({
        ...props,
        createStore: (dataModel: DataModel) => new SqliteStore(dataModel),
        emit: (event) => {
          console.log(event);
        },
        runStatements: async (statements: Array<string>) => {
          if (!this.dryRun) {
            await this.db.run(sql.raw(statements.join(";")));
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
          await this.db.run(sql.raw(`DELETE FROM ${table}`));
        }
      }
    }

    async $syncDatabase(): Promise<void> {
      // TODO: fix this, it's a hack
      const nextDataModel = await getDatamodel(this.db);
      this.dataModel = updateDataModelSequences(this.dataModel, nextDataModel);
    }

    async $transaction(cb: (seed: PgSeedClient) => Promise<void>) {
      await cb(await createSeedClient(this.db, this.options));
    }
  }

  const createSeedClient = async (
    db: DrizzleSqliteDatabase,
    options?: SeedClientOptions,
  ) => {
    const seed = new PgSeedClient(db, options);

    await seed.$syncDatabase();
    seed.$reset();

    return seed;
  };

  return createSeedClient;
}
