import dedent from "dedent";
import { existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { getRootPath } from "#config/utils.js";
import { getDataModel } from "#core/dataModel/dataModel.js";
import { sortModels } from "#core/store/topologicalSort.js";
import { link, spinner } from "../../lib/output.js";

export async function generateSeedScriptExample() {
  const seedScriptPath = join(await getRootPath(), "seed.mts");

  // If the seed script already exists, we don't want to overwrite it
  if (existsSync(seedScriptPath)) {
    return;
  }

  const dataModel = await getDataModel();
  const [model] = sortModels(dataModel);
  const template = dedent`
    // Use any TypeScript runner to run this script, for example: \`npx tsx seed.mts\`
    import { createSeedClient } from "@snaplet/seed";

    const seed = await createSeedClient({
      // Optional, the data will be printed to the console instead of being persisted to the database
      dryRun: true,
    });

    // Truncate all tables in the database
    await seed.$resetDatabase();

    // Seed the database with 10 ${model.modelName}
    await seed.${model.modelName}((x) => x(10));

    // Learn more about the \`seed\` client by following our guide: https://docs.snaplet.dev/seed/getting-started

    process.exit();
  `;

  await writeFile(seedScriptPath, template);

  spinner.succeed(
    `Generated a seed script example to ${link(seedScriptPath)}, you can start playing with it! 🌱`,
  );
}
