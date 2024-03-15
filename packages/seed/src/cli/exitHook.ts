import { asyncExitHook } from "exit-hook";
import { getSeedConfig } from "#config/seedConfig/seedConfig.js";
import { getDatabaseClient } from "#dialects/getDatabaseClient.js";

export function exitHook() {
  asyncExitHook(
    async () => {
      try {
        const seedConfig = await getSeedConfig();
        const databaseClient = await getDatabaseClient(
          seedConfig.databaseClient,
        );
        await databaseClient.disconnect();
      } catch {}
    },
    {
      wait: 300,
    },
  );
}
