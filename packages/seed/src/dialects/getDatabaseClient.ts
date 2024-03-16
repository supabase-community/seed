import { getSeedConfig } from "#config/seedConfig/seedConfig.js";
import { type DatabaseClient } from "#core/databaseClient.js";
import { drivers } from "./drivers.js";

let databaseClient: DatabaseClient | undefined;

export async function getDatabaseClient() {
  if (databaseClient) {
    return databaseClient;
  }

  const seedConfig = await getSeedConfig();

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
