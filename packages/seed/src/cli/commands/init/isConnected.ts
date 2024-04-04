import { getDatabaseClient } from "#adapters/getDatabaseClient.js";

export async function isConnected() {
  try {
    await getDatabaseClient();
    return true;
  } catch {
    return false;
  }
}
