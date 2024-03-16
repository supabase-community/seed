import dedent from "dedent";
import {
  getSeedConfigPath,
  setSeedConfig,
} from "#config/seedConfig/seedConfig.js";
import { type Driver } from "#dialects/types.js";
import { link, spinner } from "../../lib/output.js";

export async function saveSeedConfig({
  driver,
  parameters,
}: {
  driver: Driver;
  parameters: Array<unknown>;
}) {
  const template = dedent`
    import { defineConfig } from "@snaplet/seed/config";

    export default defineConfig({
      databaseClient: {
        driver: "${driver.id}",
        parameters: ${serializeParameters(parameters)},
      },
    });
  `;

  await setSeedConfig(template);

  const seedConfigPath = await getSeedConfigPath();

  spinner.succeed(`Seed config saved to ${link(seedConfigPath)}`);
}

function serializeParameters(parameters: Array<unknown>) {
  const serializedParameters = JSON.stringify(parameters);

  // We need to unquote process.env references
  const processEnvDot: [RegExp, string] = [
    /"process\.env\.(\w+)"/g,
    "process.env.$1",
  ];
  const processEnvIndexDoubleQuotes: [RegExp, string] = [
    /"process\.env\[\\"(\w+)\\"\]"/g,
    'process.env["$1"]',
  ];
  const processEnvIndexSimpleQuotes: [RegExp, string] = [
    /"process\.env\['(\w+)'\]"/g,
    "process.env['$1']",
  ];

  return serializedParameters
    .replace(...processEnvDot)
    .replace(...processEnvIndexDoubleQuotes)
    .replace(...processEnvIndexSimpleQuotes);
}
