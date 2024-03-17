import dedent from "dedent";
import {
  getSeedConfigPath,
  setSeedConfig,
} from "#config/seedConfig/seedConfig.js";
import { type Adapter } from "#dialects/types.js";
import { link, spinner } from "../../lib/output.js";

export async function saveSeedConfig({
  adapter,
  parameters,
}: {
  adapter: Adapter;
  parameters: Array<unknown>;
}) {
  const template = dedent`
    import { defineConfig } from "@snaplet/seed/config";

    export default defineConfig({
      databaseClient: {
        adapter: "${adapter.id}",
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
