import { getSeedConfig } from "#config/seedConfig/seedConfig.js";
import { type DatabaseClient } from "#core/databaseClient.js";
import { SnapletError } from "#core/utils.js";

let databaseClient: DatabaseClient | undefined;

export async function getDatabaseClient(seedConfigPath?: string) {
  if (databaseClient) {
    return databaseClient;
  }

  // patching the seedConfig requires the dataModel which doesn't exist yet during the introspection
  // this will be better when we will split the config between adapter.ts and seed.config.json
  const seedConfig = await getSeedConfig({ configPath: seedConfigPath, disablePatch: true  });

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
