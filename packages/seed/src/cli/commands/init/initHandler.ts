import path from "node:path";
import { getAdapter } from "#adapters/getAdapter.js";
import { getProjectConfig } from "#config/project/projectConfig.js";
import { seedConfigExists } from "#config/seedConfig/seedConfig.js";
import { highlight } from "../../lib/output.js";
import { linkHandler } from "../link/linkHandler.js";
import { loginHandler } from "../login/loginHandler.js";
import { syncHandler } from "../sync/syncHandler.js";
import { adapterHandler } from "./adapterHandler.js";
import { generateSeedScriptExample } from "./generateSeedScriptExample.js";
import { getUser } from "./getUser.js";
import { installDependencies } from "./installDependencies.js";
import { saveSeedConfig } from "./saveSeedConfig.js";

export async function loggedCommandPrerun(
  props: { showWelcome?: boolean } = {},
) {
  const user = await getUser();

  const welcomeText = user
    ? `Welcome back ${highlight(user.email)}! 😻`
    : `Snaplet Seed is a generative AI tool for your data, it's like Faker and your ORM had a baby! 🐣`;

  if (props.showWelcome) {
    console.log(welcomeText);
  }

  if (!user) {
    await loginHandler();
  }
}

export async function initHandler(args: { directory: string }) {
  // Every files are created in the same directory as the seed.config.ts file
  process.env["SNAPLET_SEED_CONFIG"] = path.join(
    args.directory,
    "seed.config.ts",
  );

  await loggedCommandPrerun({ showWelcome: true });

  const projectConfig = await getProjectConfig();

  if (!projectConfig.projectId) {
    await linkHandler();
  }

  if (!projectConfig.adapter) {
    await adapterHandler();
  }

  const adapter = await getAdapter();

  await installDependencies({ adapter });

  const seedConfigExist = await seedConfigExists();

  if (!seedConfigExist) {
    await saveSeedConfig({ adapter });
  }

  await syncHandler({});

  if (!seedConfigExist) {
    await generateSeedScriptExample();
  }

  console.log("Happy seeding! 🌱");
}
