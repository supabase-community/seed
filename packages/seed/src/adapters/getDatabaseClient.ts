import { getSeedConfig } from "#config/seedConfig/seedConfig.js";
import { type DatabaseClient } from "#core/databaseClient.js";
import { SnapletError } from "#core/utils.js";

let databaseClient: DatabaseClient | undefined;

export async function getDatabaseClient(seedConfigPath?: string) {
  if (databaseClient) {
    return databaseClient;
  }

  const seedConfig = await getSeedConfig(seedConfigPath);

  try {
    const _databaseClient = await seedConfig.adapter();
    await _databaseClient.query("SELECT 1");
    databaseClient = _databaseClient;
  } catch (error) {
    throw new SnapletError("SEED_ADAPTER_CANNOT_CONNECT", {
      error: error as Error,
    });
  }

  return databaseClient;
}
