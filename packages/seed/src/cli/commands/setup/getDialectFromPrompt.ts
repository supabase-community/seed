import prompt from "prompts";
import { type DialectId, dialects } from "#dialects/dialects.js";

export async function getDialectFromPrompt() {
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

  return dialect;
}
