import dedent from "dedent";
import { gracefulExit } from "exit-hook";
import prompt from "prompts";
import { z } from "zod";
import { type DialectId, dialects } from "#dialects/dialects.js";
import { type DriverId, drivers } from "#dialects/drivers.js";
import { getDatabaseClient } from "#dialects/getDatabaseClient.js";

export async function seedConfigHandler() {
  const dialectChoices = Object.keys(dialects)
    .sort((a, b) => a.localeCompare(b))
    .map((dialectId) => ({
      title: dialectId,
    }));

  const { dialectIndex } = (await prompt({
    type: "select",
    name: "dialectIndex",
    message: "What database dialect would you like to use?",
    choices: dialectChoices,
  })) as { dialectIndex: number };

  const dialectId = dialectChoices[dialectIndex].title as DialectId;

  const dialect = dialects[dialectId];

  const driverChoices = Object.keys(dialect.drivers)
    .map((driverId) => ({
      title: driverId,
    }))
    .sort((a, b) => a.title.localeCompare(b.title));

  const { driverIndex } = (await prompt({
    type: "select",
    name: "driverIndex",
    message: "What database client would you like to use?",
    choices: driverChoices,
  })) as { driverIndex: number };

  const driverId = driverChoices[driverIndex].title as DriverId;

  const driver = drivers[driverId];

  // the parameters are raw strings
  const parameters: Array<unknown> = [];
  // the runtime parameters have their process.env values resolved
  const runtimeParameters: Array<unknown> = [];

  for (const item of driver.parameters.items) {
    if (item instanceof z.ZodObject) {
      const entries = Object.entries(item.shape);
      let parameter: Record<string, unknown> = {};
      let runtimeParameter: Record<string, unknown> = {};
      for (const [key, subItem] of entries) {
        const { value } = (await prompt({
          type: "text",
          name: "value",
          message: subItem.description,
        })) as { value: string };
        parameter[key] = value;
        runtimeParameter[key] = value.startsWith("process.env.")
          ? process.env[value.slice("process.env.".length)]
          : value;
      }
      parameters.push(parameter);
      runtimeParameters.push(runtimeParameter);
    } else {
      const { value } = (await prompt({
        type: "text",
        name: "value",
        message: item.description,
      })) as { value: string };
      parameters.push(value);
      runtimeParameters.push(
        value.startsWith("process.env.")
          ? process.env[value.slice("process.env.".length)]
          : value,
      );
    }
  }

  const databaseClient = await getDatabaseClient({
    driver: driverId,
    // @ts-expect-error: we can't know the type of the parameters as we're dynamically asking for them
    parameters: runtimeParameters,
  });

  // assert database connectivity
  try {
    await databaseClient.query("SELECT 1");
  } catch (e) {
    console.error(`Could not connect to the database: ${(e as Error).message}`);
    gracefulExit(1);
  }

  // save the seed config
  const template = dedent`
    import { defineConfig } from "@snaplet/seed";
    import { createDatabaseClient } from "@snaplet/seed/${driverId}";
    ${driver.template.import}

    export default defineConfig({
      databaseClient: () => createDatabaseClient(${driver.template.create(parameters)})
    });
  `;

  console.log(template);
}
