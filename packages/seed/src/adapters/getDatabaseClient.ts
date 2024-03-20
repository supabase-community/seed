import { getSeedConfig } from "#config/seedConfig/seedConfig.js";
import { type DatabaseClient } from "#core/databaseClient.js";
import { SnapletError } from "#core/utils.js";

let databaseClient: DatabaseClient | undefined;

export async function getDatabaseClient() {
  if (databaseClient) {
    return databaseClient;
  }

  const seedConfig = await getSeedConfig();

  try {
    databaseClient = await seedConfig.adapter();
    await databaseClient.query("SELECT 1");
  } catch (error) {
    throw new SnapletError("SEED_ADAPTER_CANNOT_CONNECT", {
      error: error as Error,
    });
  }

  return databaseClient;
}
