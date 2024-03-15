import { getSeedConfig } from "#config/seedConfig/seedConfig.js";

export async function getDatabaseClient() {
  const seedConfig = await getSeedConfig();
  return seedConfig.databaseClient();
}
