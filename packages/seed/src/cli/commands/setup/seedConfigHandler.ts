import prompt from "prompts";
import { type DialectId, dialects } from "#dialects/dialects.js";
import { type DriverId, drivers } from "#dialects/drivers.js";

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

  for (const parameter of driver.parameters.items) {
    console.log(driver.parameters);
    console.log(parameter);
    console.log(parameter._def);
    console.log(parameter._type);
    console.log(parameter.description);
  }
}
