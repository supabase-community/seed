import { EOL } from "node:os";
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
import { fetchSequences } from "./introspect/queries/fetchSequences.js";
import { SqliteStore } from "./store.js";
import { escapeIdentifier } from "./utils.js";

export const getSeedClient: GetSeedClient = (props) => {
  class SqliteSeedClient extends SeedClientBase {
    readonly db: DatabaseClient;
    readonly dryRun: boolean;
    readonly options?: SeedClientOptions;

    constructor(databaseClient: DatabaseClient, options?: SeedClientOptions) {
      super({
        ...props,
        createStore: (dataModel: DataModel) => new SqliteStore(dataModel),
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
        const tablesToTruncate = filteredModels.map((model) =>
          escapeIdentifier(model.tableName),
        );
        // We need to disable foreign keys to truncate tables to avoid integrity errors
        await this.db.execute("PRAGMA foreign_keys = OFF");
        for (const table of tablesToTruncate) {
          await this.db.execute(`DELETE FROM ${table}`);
        }
        await this.db.execute("PRAGMA foreign_keys = ON");
        // reset sequences
        for (const model of filteredModels) {
          for (const field of model.fields) {
            if (field.sequence && field.sequence.identifier !== null) {
              await this.db.execute(
                `UPDATE sqlite_sequence SET seq = 0 WHERE name = '${field.sequence.identifier}'`,
              );
            }
          }
        }
        this.state = this.getInitialState();
        await this.$syncDatabase();
      }
    }

    async $syncDatabase(): Promise<void> {
      const sequences = await fetchSequences(this.db);
      const sequencesCurrent = sequences.reduce<Record<string, number>>(
        (acc, sequence) => {
          acc[sequence.name] = sequence.current;
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
      dialect: "sqlite",
      async createClient() {
        const databaseClient =
          options?.adapter ?? (await getDatabaseClient(props.seedConfigPath));
        return new SqliteSeedClient(databaseClient, options);
      },
    });
  };

  return createSeedClient;
};
