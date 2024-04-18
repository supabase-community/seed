import { dotSnapletPathExists } from "#config/dotSnaplet.js";
import { projectConfigExists } from "#config/project/projectConfig.js";
import { seedConfigExists } from "#config/seedConfig/seedConfig.js";
import { highlight } from "../../lib/output.js";
import { linkHandler } from "../link/linkHandler.js";
import { loginHandler } from "../login/loginHandler.js";
import { syncHandler } from "../sync/syncHandler.js";
import { generateSeedScriptExample } from "./generateSeedScriptExample.js";
import { getAdapter } from "./getAdapter.js";
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

  const seedConfigExist = await seedConfigExists();
  const projectConfigExist = await projectConfigExists();
  const dotSnapletExist = await dotSnapletPathExists();
  const isFirstTimeInit = !seedConfigExist || !projectConfigExist;
  return {
    isFirstTimeInit,
    seedConfigExist,
    projectConfigExist,
    dotSnapletExist,
  };
}

export async function initHandler() {
  const { isFirstTimeInit } = await loggedCommandPrerun({ showWelcome: true });
  if (isFirstTimeInit) {
    await linkHandler();
    const adapter = await getAdapter();
    await installDependencies({ adapter });
    await saveSeedConfig({ adapter });
  }

  await syncHandler({});

  if (isFirstTimeInit) {
    await generateSeedScriptExample();
  }

  console.log("Happy seeding! 🌱");
}
