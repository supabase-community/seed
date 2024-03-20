import { getDatabaseClient } from "#adapters/getDatabaseClient.js";

export async function isConnected() {
  try {
    const databaseClient = await getDatabaseClient();
    await databaseClient.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
