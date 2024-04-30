import boxen from 'boxen'
import path from "node:path";
import { confirm } from "@inquirer/prompts";
import { getProjectConfig } from "#config/project/projectConfig.js";
import { bold, highlight } from "../../lib/output.js";
import { linkHandler } from "../link/linkHandler.js";
import { loginHandler } from "../login/loginHandler.js";
import { syncHandler } from "../sync/syncHandler.js";
import { generateSeedScriptExample } from "./generateSeedScriptExample.js";
import { getAdapter } from "./getAdapter.js";
import { getUser } from "./getUser.js";
import { installDependencies } from "./installDependencies.js";
import { saveSeedConfig } from "./saveSeedConfig.js";
import { adapters } from '#adapters/index.js';

export async function initHandler(args: {
  directory: string;
  reset?: boolean;
}) {
  // Every files are created in the same directory as the seed.config.ts file
  process.env["SNAPLET_SEED_CONFIG"] = path.join(
    args.directory,
    "seed.config.ts",
  );

  const user = await getUser();

  const welcomeText = user
    ? `Welcome back ${highlight(user.email)}! 😻`
    : `Snaplet Seed is a generative AI tool for your data, it's like Faker and your ORM had a baby! 🐣`;

  console.log(welcomeText);

  const projectConfig = await getProjectConfig();

  if (!user) {
    const shouldUseSnapletAI = await confirm({
      message: `Would you like to use Snaplet AI to enhance your generated data?`,
      default: true
    })

    if (shouldUseSnapletAI === true) {
      await loginHandler();
    }
  }

  await linkHandler();
  const adapter = projectConfig.adapter ? adapters[projectConfig.adapter] : await getAdapter();
  await installDependencies({ adapter });
  await saveSeedConfig({ adapter });

  await syncHandler({ isInit: true });
  await generateSeedScriptExample();

  console.log(boxen(`To enhance your data with Snaplet AI, just rerun ${bold('npx @snaplet/seed init')}`, {
    padding: 1,
    margin: 1,
    borderStyle: 'bold'
  }))

  console.log()

  console.log("Happy seeding! 🌱");
}