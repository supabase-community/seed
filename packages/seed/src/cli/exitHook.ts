import { asyncExitHook } from "exit-hook";
import { getDatabaseClient } from "#dialects/getDatabaseClient.js";

export function exitHook() {
  asyncExitHook(
    async () => {
      try {
        const databaseClient = await getDatabaseClient();
        await databaseClient.disconnect();
      } catch {}
    },
    {
      wait: 300,
    },
  );
}
