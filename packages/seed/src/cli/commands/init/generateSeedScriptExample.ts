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
    /**
     * ! Executing this script will delete all data in your database and seed it with 10 versions.
     * ! Make sure to adjust the script to your needs.
     * Use any TypeScript runner to run this script, for example: \`npx tsx seed.mts\`
     * Learn more about the Seed Client by following our guide: https://docs.snaplet.dev/seed/getting-started
     */
    import { createSeedClient } from "@snaplet/seed";

    const seed = await createSeedClient();

    // Truncate all tables in the database
    await seed.$resetDatabase();

    // Seed the database with 10 ${model.modelName}
    await seed.${model.modelName}((x) => x(10));

    process.exit();
  `;

  await writeFile(seedScriptPath, template);

  spinner.succeed(`Generated a seed script example to ${link(seedScriptPath)}`);

  spinner.warn(
    `Executing this script will delete all data in your database and seed it with 10 ${model.modelName}. Make sure to adjust the script to your needs.`,
  );

  console.log("Happy seeding! 🌱");
}
