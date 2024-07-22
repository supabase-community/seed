import dedent from "dedent";
import path from "node:path";
import { adapters } from "#adapters/index.js";
import { getProjectConfig } from "#config/project/projectConfig.js";
import { seedConfigExists } from "#config/seedConfig/seedConfig.js";
import { updatePackageJson } from "#config/utils.js";
import { bold, dim, link } from "../../lib/output.js";
import { syncHandler } from "../sync/syncHandler.js";
import { adapterHandler } from "./adapterHandler.js";
import { generateSeedScriptExample } from "./generateSeedScriptExample.js";
import { installDependencies } from "./installDependencies.js";
import { saveSeedConfig } from "./saveSeedConfig.js";

export async function initHandler(args: {
  directory: string;
  reset?: boolean;
}) {
  // Every files are created in the same directory as the seed.config.ts file
  process.env["SNAPLET_SEED_CONFIG"] = path.join(
    args.directory,
    "seed.config.ts",
  );
  // If it's a custom directory, we add the @snaplet/seed config path to the package.json
  if (args.directory !== ".") {
    await updatePackageJson({
      "@snaplet/seed": {
        config: process.env["SNAPLET_SEED_CONFIG"],
      },
    });
  }

  const welcomeText = `Welcome to ${bold("@snaplet/seed")}! Snaplet Seed populates your database with realistic, production-like mock data ✨`;

  console.log();
  console.log(welcomeText);

  const projectConfig = await getProjectConfig();

  const adapter = projectConfig.adapter
    ? adapters[projectConfig.adapter]
    : await adapterHandler();

  await installDependencies({ adapter });

  const hadSeedConfig = await seedConfigExists();

  if (!hadSeedConfig) {
    await saveSeedConfig({ adapter });
  }

  await syncHandler({ isInit: true });

  const seedScriptExamplePath = await generateSeedScriptExample();

  console.log(
    "\n" +
      dedent`
      ✅ Seed is now set up for your project. Here's what to do next:

        ${bold("1. Edit and run your seed script")} 📝
        ${bold("$")} code ${path.relative(process.cwd(), seedScriptExamplePath)}  ${dim("# Tell Seed how to seed your database")}
        ${bold("$")} npx tsx seed.ts  ${dim("# Run your seed script")}

        ${bold("2. Learn more")} 📚
        * Quick start guide: ${link("https://docs.snaplet.dev/getting-started/quick-start/seed")}
        * Community and support: ${link("https://app.snaplet.dev/chat")}

      Happy seeding! 🌱`,
  );
}
