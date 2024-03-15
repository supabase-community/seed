import { getSeedConfig } from "#config/seedConfig/seedConfig.js";
import { type DatabaseClient } from "#core/adapters.js";

let databaseClient: DatabaseClient | undefined;

export async function getDatabaseClient() {
  if (databaseClient) {
    return databaseClient;
  }

  const seedConfig = await getSeedConfig();
  databaseClient = seedConfig.databaseClient();
  return databaseClient;
}
