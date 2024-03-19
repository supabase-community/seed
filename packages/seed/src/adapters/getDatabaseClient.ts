import { getSeedConfig } from "#config/seedConfig/seedConfig.js";
import { type DatabaseClient } from "#core/databaseClient.js";

let databaseClient: DatabaseClient | undefined;

export async function getDatabaseClient() {
  if (databaseClient) {
    return databaseClient;
  }

  const seedConfig = await getSeedConfig();

  return seedConfig.adapter();
}
