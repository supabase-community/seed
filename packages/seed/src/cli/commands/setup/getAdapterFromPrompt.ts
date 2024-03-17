import prompt from "prompts";
import { type AdapterId, adapters } from "#adapters/index.js";

export async function getAdapterFromPrompt() {
  const adapterChoices = Object.keys(adapters)
    .map((title) => ({ title }))
    .sort((a, b) => a.title.localeCompare(b.title));

  const { adapterIndex } = (await prompt({
    type: "select",
    name: "adapterIndex",
    message: "What database client would you like to use?",
    choices: adapterChoices,
  })) as { adapterIndex: number };

  const adapterId = adapterChoices[adapterIndex].title as AdapterId;

  const adapter = adapters[adapterId];

  return adapter;
}
