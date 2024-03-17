import { seedConfigExists } from "#config/seedConfig/seedConfig.js";
import { bold, highlight } from "../../lib/output.js";
import { introspectHandler } from "../introspect/introspectHandler.js";
import { loginHandler } from "../login/loginHandler.js";
import { getAdapterFromPrompt } from "./getAdapterFromPrompt.js";
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

  if (!(await seedConfigExists())) {
    const adapter = await getAdapterFromPrompt();

    await saveSeedConfig({ adapter });
  }

  await introspectHandler();

  // await generateHandler({});
}
