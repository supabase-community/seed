import { getDialectFromPrompt } from "./getDialectFromPrompt.js";
import { getDriverFromPrompt } from "./getDriverFromPrompt.js";
import { getParametersFromPrompt } from "./getParametersFromPrompt.js";
import { installDependencies } from "./installDependencies.js";
import { saveSeedConfig } from "./saveSeedConfig.js";

export async function seedConfigHandler() {
  const dialect = await getDialectFromPrompt();

  const driver = await getDriverFromPrompt(dialect);

  const parameters = await getParametersFromPrompt(driver);

  await installDependencies({ driver });

  await saveSeedConfig({ driver, parameters });
}
