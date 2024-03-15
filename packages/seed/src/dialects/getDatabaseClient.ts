import { getSnapletSeedConfig } from "#config/seedConfig/seedConfig.js";
import { type DatabaseClient } from "#core/adapters.js";
import { postgresDrivers } from "./postgres/drivers/index.js";
import { sqliteDrivers } from "./sqlite/drivers/index.js";

const drivers = {
  ...postgresDrivers,
  ...sqliteDrivers,
};

export async function getDatabaseClient(): Promise<DatabaseClient> {
  const seedConfig = await getSnapletSeedConfig();

  switch (seedConfig.databaseClient.driver) {
    case "better-sqlite3":
      return drivers[seedConfig.databaseClient.driver].getDatabaseClient(
        ...seedConfig.databaseClient.parameters,
      );
    case "node-postgres":
      return drivers[seedConfig.databaseClient.driver].getDatabaseClient(
        ...seedConfig.databaseClient.parameters,
      );
    case "postgres-js":
      return drivers[seedConfig.databaseClient.driver].getDatabaseClient(
        ...seedConfig.databaseClient.parameters,
      );
  }
}
