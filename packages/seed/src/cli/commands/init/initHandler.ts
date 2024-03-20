import { seedConfigExists } from "#config/seedConfig/seedConfig.js";
import { highlight } from "../../lib/output.js";
import { loginHandler } from "../login/loginHandler.js";
import { syncHandler } from "../sync/syncHandler.js";
import { generateSeedScriptExample } from "./generateSeedScriptExample.js";
import { getAdapter } from "./getAdapter.js";
import { getUser } from "./getUser.js";
import { installDependencies } from "./installDependencies.js";
import { saveSeedConfig } from "./saveSeedConfig.js";

export async function initHandler() {
  const user = await getUser();

  const welcomeText = user
    ? `Welcome back ${highlight(user.email)}! 😻`
    : `Snaplet Seed is a generative AI tool for your data, it's like Faker and your ORM had a baby! 🐣`;

  console.log(welcomeText);

  if (!user) {
    await loginHandler();
  }

  await installDependencies();

  const isFirstTimeInit = !(await seedConfigExists());

  if (isFirstTimeInit) {
    const adapter = await getAdapter();

    await saveSeedConfig({ adapter });
  }

  await syncHandler({});

  if (isFirstTimeInit) {
    await generateSeedScriptExample();
  }
}
