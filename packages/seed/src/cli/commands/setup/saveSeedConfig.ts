import dedent from "dedent";
import { setSeedConfig } from "#config/seedConfig/seedConfig.js";
import { type Driver } from "#dialects/types.js";

export async function saveSeedConfig({
  driver,
  parameters,
}: {
  driver: Driver;
  parameters: Array<unknown>;
}) {
  const template = dedent`
    import { defineConfig } from "@snaplet/seed";
    import { createDatabaseClient } from "@snaplet/seed/${driver.id}";
    ${driver.template.import}

    export default defineConfig({
      databaseClient: () => createDatabaseClient(${driver.template.create(parameters)})
    });
  `;

  await setSeedConfig(template);

  // const databaseClient = await getDatabaseClient();
  // try {
  //   await databaseClient.query("SELECT 1");
  // } catch (error) {
  //   await deleteSeedConfig();
  //   console.error(
  //     "Failed to connect to the database with the provided configuration",
  //   );
  //   console.error(error);
  //   gracefulExit(1);
  // }
}
