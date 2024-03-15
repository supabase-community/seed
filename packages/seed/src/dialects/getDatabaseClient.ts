import { type DatabaseClientConfig } from "#config/seedConfig/databaseClientConfig.js";
import { type DatabaseClient } from "#core/adapters.js";
import { drivers } from "./drivers.js";

export async function getDatabaseClient(
  databaseClientConfig: DatabaseClientConfig,
): Promise<DatabaseClient> {
  switch (databaseClientConfig.driver) {
    case "better-sqlite3":
      return drivers[databaseClientConfig.driver].getDatabaseClient(
        ...databaseClientConfig.parameters,
      );
    case "node-postgres":
      return drivers[databaseClientConfig.driver].getDatabaseClient(
        ...databaseClientConfig.parameters,
      );
    case "postgres-js":
      return drivers[databaseClientConfig.driver].getDatabaseClient(
        ...databaseClientConfig.parameters,
      );
  }
}
