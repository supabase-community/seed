import prompt from "prompts";
import { type Dialect } from "#core/dialect/types.js";
import { type DriverId, drivers } from "#dialects/drivers.js";

export async function getDriverFromPrompt(dialect: Dialect) {
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

  return driver;
}
