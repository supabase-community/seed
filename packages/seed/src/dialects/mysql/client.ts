import { EOL } from "node:os";
import { getAdapter } from "#adapters/getAdapter.js";
import { getDatabaseClient } from "#adapters/getDatabaseClient.js";
import { type SelectConfig } from "#config/seedConfig/selectConfig.js";
import {
  type GetSeedClient,
  SeedClientBase,
  setupClient,
} from "#core/client/client.js";
import { type SeedClientOptions } from "#core/client/types.js";
import { filterModelsBySelectConfig } from "#core/client/utils.js";
import { type DataModel } from "#core/dataModel/types.js";
import { type DatabaseClient } from "#core/databaseClient.js";
import { patchUserModelsSequences } from "#core/sequences/sequences.js";
import { type UserModels } from "#core/userModels/types.js";
import { fetchSequences } from "./introspect/queries/fetchSequences.js";
import { MySQLStore } from "./store.js";
import { escapeIdentifier } from "./utils.js";

export const getSeedClient: GetSeedClient = (props) => {
  class MySQLSeedClient extends SeedClientBase {
    readonly db: DatabaseClient;
    readonly dryRun: boolean;
    readonly options?: SeedClientOptions;

    constructor(
      databaseClient: DatabaseClient,
      userModels: UserModels,
      options?: SeedClientOptions,
    ) {
      super({
        dataModel: props.dataModel,
        fingerprint: props.fingerprint,
        userModels,
        createStore: (dataModel: DataModel) => new MySQLStore(dataModel),
        runStatements: async (statements: Array<string>) => {
          if (!this.dryRun) {
            for (const statement of statements) {
              await this.db.execute(statement);
            }
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
    async $resetDatabase(selectConfig?: SelectConfig) {
      const models = Object.values(this.dataModel.models);
      const filteredModels = filterModelsBySelectConfig(models, selectConfig);

      if (!this.dryRun) {
        const tablesToTruncate = filteredModels.map(
          (model) =>
            `${escapeIdentifier(model.schemaName)}.${escapeIdentifier(model.tableName)}`,
        );

        if (tablesToTruncate.length > 0) {
          await this.db.execute(`SET FOREIGN_KEY_CHECKS = 0;`); // Disable foreign key checks
          for (const table of tablesToTruncate) {
            await this.db.execute(`TRUNCATE TABLE ${table}`);
          }
          await this.db.execute(`SET FOREIGN_KEY_CHECKS = 1;`); // Re-enable foreign key checks
        }

        // Reset AUTO_INCREMENT for tables that have it
        for (const model of filteredModels) {
          const autoIncrementField = model.fields.find(
            (f) => f.isId && f.sequence,
          );
          if (autoIncrementField) {
            await this.db.execute(
              `ALTER TABLE ${escapeIdentifier(model.schemaName)}.${escapeIdentifier(model.tableName)} AUTO_INCREMENT = 1;`,
            );
          }
        }

        await this.$syncDatabase();
        this.state = this.getInitialState();
      }
    }

    async $syncDatabase(): Promise<void> {
      const schemas = [
        ...new Set(
          Object.values(this.dataModel.models).map((m) => m.schemaName),
        ),
      ].filter(Boolean);
      const sequences = await fetchSequences(this.db, schemas);
      const sequencesCurrent = sequences.reduce<Record<string, number>>(
        (acc, sequence) => {
          acc[sequence.name] = sequence.current as number;
          return acc;
        },
        {},
      );
      patchUserModelsSequences({
        dataModel: this.dataModel,
        initialUserModels: this.initialUserModels,
        sequencesCurrent,
        userModels: this.userModels,
      });
    }
  }

  const createSeedClient = async (options?: SeedClientOptions) => {
    return setupClient({
      dialect: "mysql",
      async createClient() {
        const databaseClient = options?.adapter ?? (await getDatabaseClient());
        const adapter = await getAdapter();
        const userModels = adapter.patchUserModels
          ? await adapter.patchUserModels({
              dataModel: props.dataModel,
              userModels: props.userModels,
            })
          : props.userModels;
        return new MySQLSeedClient(databaseClient, userModels, options);
      },
    });
  };

  return createSeedClient;
};
