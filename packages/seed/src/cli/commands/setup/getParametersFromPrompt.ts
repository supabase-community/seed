import prompt from "prompts";
import { z } from "zod";
import { type Driver } from "#dialects/types.js";

export async function getParametersFromPrompt(driver: Driver) {
  const parameters: Array<unknown> = [];

  for (const item of driver.parameters.items) {
    if (item instanceof z.ZodObject) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const entries = Object.entries(item.shape);
      let parameter: Record<string, unknown> = {};
      for (const [key, subItem] of entries) {
        const { value } = (await prompt({
          type: "text",
          name: "value",
          message: `What is your ${(subItem as z.ZodString).description}?`,
        })) as { value: string };
        parameter[key] = value;
      }
      parameters.push(parameter);
    } else {
      const { value } = (await prompt({
        type: "text",
        name: "value",
        message: `What is your ${item.description}?`,
      })) as { value: string };
      parameters.push(value);
    }
  }

  return parameters;
}
