import { getDatabaseClient } from "#adapters/getDatabaseClient.js";

export async function isConnected() {
  try {
    await getDatabaseClient();
    return { result: true };
  } catch (err) {
    return { result: false, reason: err };
  }
}
