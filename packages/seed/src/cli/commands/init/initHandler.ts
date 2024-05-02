import { confirm } from "@inquirer/prompts";
import boxen from "boxen";
import path from "node:path";
import { adapters } from "#adapters/index.js";
import { getUser } from "#cli/lib/getUser.js";
import { getProjectConfig } from "#config/project/projectConfig.js";
import { seedConfigExists } from "#config/seedConfig/seedConfig.js";
import { bold, brightGreen, highlight } from "../../lib/output.js";
import { linkHandler } from "../link/linkHandler.js";
import { loginHandler } from "../login/loginHandler.js";
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

  const user = await getUser();

  const welcomeText = user
    ? `Welcome back ${highlight(user.email)}! 😻`
    : `Snaplet Seed is a generative AI tool for your data, it's like Faker and your ORM had a baby! 🐣`;

  console.log();
  console.log(welcomeText);

  const projectConfig = await getProjectConfig();
  let isLoggedIn = Boolean(user);

  if (!user) {
    console.log();
    console.log(
      `🤖 ${bold("@snaplet/seed")} works best with ${highlight("Snaplet AI")}. It requires a free Snaplet account, but improves data quality significantly! 🤖`,
    );
    console.log();

    const shouldUseSnapletAI = await confirm({
      message: `Would you like to use ${brightGreen("Snaplet AI to enhance")} your generated data?`,
      default: true,
    });

    if (shouldUseSnapletAI) {
      await loginHandler();
      isLoggedIn = true;
    }
  }

  if (!projectConfig.projectId && isLoggedIn) {
    await linkHandler();
  }

  const adapter = projectConfig.adapter
    ? adapters[projectConfig.adapter]
    : await adapterHandler();

  await installDependencies({ adapter });

  if (!(await seedConfigExists())) {
    await saveSeedConfig({ adapter });
  }

  await syncHandler({ isInit: true });

  if (!isLoggedIn) {
    console.log(
      boxen(
        `Want to improve your data? Use ${highlight("Snaplet AI")}! Rerun ${bold("npx @snaplet/seed init")} and choose ${bold("Snaplet AI")}.`,
        {
          padding: 1,
          margin: 1,
          borderStyle: "bold",
        },
      ),
    );
  }

  await generateSeedScriptExample();

  console.log();
  console.log("Happy seeding! 🌱");
}
