import { getAdapterFromPrompt } from "./getAdapterFromPrompt.js";
import { getParametersFromPrompt } from "./getParametersFromPrompt.js";
import { installDependencies } from "./installDependencies.js";
import { saveSeedConfig } from "./saveSeedConfig.js";

export async function seedConfigHandler() {
  // const dialect = await getDialectFromPrompt();

  const adapter = await getAdapterFromPrompt();

  const parameters = await getParametersFromPrompt(adapter);

  await installDependencies({ adapter });

  await saveSeedConfig({ adapter, parameters });
}
