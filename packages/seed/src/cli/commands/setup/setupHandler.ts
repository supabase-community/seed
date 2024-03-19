import { seedConfigExists } from "#config/seedConfig/seedConfig.js";
import { bold, highlight } from "../../lib/output.js";
import { generateHandler } from "../generate/generateHandler.js";
import { introspectHandler } from "../introspect/introspectHandler.js";
import { loginHandler } from "../login/loginHandler.js";
import { generateSeedScriptExample } from "./generateSeedScriptExample.js";
import { getAdapter } from "./getAdapter.js";
import { getUser } from "./getUser.js";
import { installDependencies } from "./installDependencies.js";
import { saveSeedConfig } from "./saveSeedConfig.js";

export async function setupHandler() {
  const user = await getUser();

  const welcomeText = user
    ? `Welcome back ${highlight(user.email)}! 🌱`
    : `Welcome to ${bold("@snaplet/seed")}, your best data buddy! 🌱`;

  console.log(welcomeText);

  if (!user) {
    await loginHandler();
  }

  await installDependencies();

  const isFirstTimeSetup = !(await seedConfigExists());

  if (isFirstTimeSetup) {
    const adapter = await getAdapter();

    await saveSeedConfig({ adapter });
  }

  await introspectHandler();

  await generateHandler({});

  if (isFirstTimeSetup) {
    await generateSeedScriptExample();
  }
}
